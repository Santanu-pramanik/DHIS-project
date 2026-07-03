from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
import pandas as pd
import os
from dotenv import load_dotenv
import anthropic
import hashlib
import httpx
import uuid
from datetime import datetime, timezone

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
FAST2SMS_KEY = os.getenv("FAST2SMS_API_KEY")

# ── SMS Helper ───────────────────────────────────────────────
async def send_sms(mobile: str, otp_or_id: str) -> bool:
    """Send SMS via Fast2SMS OTP route"""
    if not FAST2SMS_KEY:
        print("[SMS] FAST2SMS_API_KEY not set, skipping SMS")
        return False
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(
                "https://www.fast2sms.com/dev/bulkV2",
                headers={"authorization": FAST2SMS_KEY},
                params={
                    "variables_values": otp_or_id,
                    "route": "otp",        # ← "q" এর বদলে "otp"
                    "numbers": mobile,
                }
            )
            data = res.json()
            print(f"[Fast2SMS] {data}")
            return data.get("return", False)
    except Exception as e:
        print(f"[Fast2SMS Error] {e}")
        return False
# ── Password helper ──────────────────────────────────────────
def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# ── Root ─────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "DHIS API running"}

@app.get("/districts")
def get_districts():
    res = supabase.table("districts").select("*").execute()
    return res.data

@app.get("/cases/{district_id}")
def get_cases(district_id: int):
    res = supabase.table("disease_cases").select("*").eq("district_id", district_id).execute()
    return res.data

@app.get("/analysis/{district_id}")
def get_analysis(district_id: int):
    cases = supabase.table("disease_cases").select("*").eq("district_id", district_id).execute().data
    hospitals = supabase.table("hospitals").select("*").eq("district_id", district_id).execute().data
    requirements = supabase.table("doctor_requirements").select("*").execute().data

    df = pd.DataFrame(cases)
    req_df = pd.DataFrame(requirements)

    if df.empty:
        return {"error": "No data found"}

    total_cases = int(df["case_count"].sum())
    top_disease = df.loc[df["case_count"].idxmax(), "disease_type"]
    top_count = int(df["case_count"].max())
    category_summary = df.groupby("category")["case_count"].sum().to_dict()

    merged = df.merge(req_df, on="disease_type", how="left")
    merged["doctors_needed"] = merged["case_count"] / merged["cases_per_doctor"]
    required_doctors = int(merged["doctors_needed"].sum().round())

    total_doctors = sum(h["total_doctors"] for h in hospitals)
    available_doctors = sum(h["available_doctors"] for h in hospitals)
    shortage = max(0, required_doctors - available_doctors)

    disease_breakdown = df.groupby("disease_type")["case_count"].sum().sort_values(ascending=False).to_dict()

    return {
        "total_cases": total_cases,
        "top_disease": top_disease,
        "top_count": top_count,
        "category_summary": category_summary,
        "required_doctors": required_doctors,
        "available_doctors": available_doctors,
        "total_hospitals": len(hospitals),
        "shortage": shortage,
        "disease_breakdown": disease_breakdown
    }

@app.post("/cases/add")
def add_case(data: dict):
    existing = supabase.table("disease_cases")\
        .select("*")\
        .eq("district_id", data.get("district_id"))\
        .eq("disease_type", data.get("disease_type"))\
        .eq("month", data.get("month"))\
        .eq("year", data.get("year"))\
        .execute()

    if existing.data:
        old_count = existing.data[0]["case_count"]
        new_count = old_count + data.get("case_count", 0)
        res = supabase.table("disease_cases")\
            .update({"case_count": new_count})\
            .eq("id", existing.data[0]["id"])\
            .execute()
        return {"message": f"Updated! {old_count} + {data['case_count']} = {new_count}", "data": res.data}

    res = supabase.table("disease_cases").insert(data).execute()
    return {"message": "Added successfully!", "data": res.data}

@app.delete("/cases/{case_id}")
def delete_case(case_id: int):
    res = supabase.table("disease_cases").delete().eq("id", case_id).execute()
    return res.data

@app.put("/cases/{case_id}")
def update_case(case_id: int, data: dict):
    res = supabase.table("disease_cases").update(data).eq("id", case_id).execute()
    return res.data

@app.get("/hospitals/{district_id}")
def get_hospitals(district_id: int):
    res = supabase.table("hospitals").select("*").eq("district_id", district_id).execute()
    return res.data

@app.get("/hospital/{hospital_id}/details")
def get_hospital_details(hospital_id: int):
    hospital = supabase.table("hospitals").select("*").eq("id", hospital_id).execute().data
    departments = supabase.table("departments").select("*").eq("hospital_id", hospital_id).execute().data
    doctors = supabase.table("doctors").select("*").eq("hospital_id", hospital_id).execute().data
    return {
        "hospital": hospital[0] if hospital else {},
        "departments": departments,
        "doctors": doctors
    }

@app.post("/ai/symptom-check")
async def symptom_check(data: dict):
    symptoms = data.get("symptoms", "")
    district = data.get("district", "Kolkata")

    cases = supabase.table("disease_cases").select("*").execute().data
    hospitals = supabase.table("hospitals").select("*").execute().data

    df = pd.DataFrame(cases)
    top_diseases = df.groupby("disease_type")["case_count"].sum().sort_values(ascending=False).head(5).to_dict() if not df.empty else {}
    hospital_list = [h["hospital_name"] for h in hospitals]

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=500,
        system=f"""You are a medical assistant for DHIS - District Health Intelligence System in West Bengal, India.
Current district: {district}
Top diseases in this district: {top_diseases}
Available hospitals: {', '.join(hospital_list)}

Based on symptoms, suggest possible diseases and recommend hospitals.
Keep response concise, helpful and in simple English.
Always remind users to consult a real doctor.
Format:
- Possible conditions: ...
- Recommended hospital: ...
- Precautions: ...
- ⚠️ Please consult a doctor immediately.""",
        messages=[{"role": "user", "content": f"Patient symptoms: {symptoms}"}]
    )
    return {"response": message.content[0].text}

@app.post("/ai/chat")
async def ai_chat(data: dict):
    question = data.get("question", "")
    district_id = data.get("district_id", 1)
    district_name = data.get("district_name", "Kolkata")

    cases = supabase.table("disease_cases").select("*").eq("district_id", district_id).execute().data
    hospitals = supabase.table("hospitals").select("*").eq("district_id", district_id).execute().data

    df = pd.DataFrame(cases)
    if not df.empty:
        total_cases = int(df["case_count"].sum())
        top_disease = df.loc[df["case_count"].idxmax(), "disease_type"]
        disease_breakdown = df.groupby("disease_type")["case_count"].sum().sort_values(ascending=False).head(8).to_dict()
    else:
        total_cases = 0
        top_disease = "N/A"
        disease_breakdown = {}

    total_doctors = sum(h["total_doctors"] for h in hospitals)
    available_doctors = sum(h["available_doctors"] for h in hospitals)
    hospital_names = [h["hospital_name"] for h in hospitals]

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=400,
        system=f"""You are DHIS AI Assistant for West Bengal District Health Intelligence System.
Current district: {district_name}
Real-time health data:
- Total cases: {total_cases}
- Top disease: {top_disease}
- Disease breakdown: {disease_breakdown}
- Total doctors: {total_doctors}
- Available doctors: {available_doctors}
- Hospitals: {', '.join(hospital_names)}

Answer health questions based on this real data. Be concise and helpful.
Always suggest consulting real doctors for medical advice.""",
        messages=[{"role": "user", "content": question}]
    )
    return {"response": message.content[0].text}

# ── Doctor Routes ─────────────────────────────────────────────
@app.post("/doctor/login")
def doctor_login(data: dict):
    unique_id = data.get("unique_id")
    password = data.get("password")
    res = supabase.table("doctors")\
        .select("*")\
        .eq("unique_id", unique_id)\
        .eq("password", password)\
        .execute()
    if not res.data:
        return {"success": False, "message": "Invalid ID or password"}
    return {"success": True, "doctor": res.data[0]}

@app.post("/doctor/attendance")
def mark_attendance(data: dict):
    from datetime import datetime, timezone
    doctor_id = data.get("doctor_id")
    hospital_id = data.get("hospital_id")
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    existing = supabase.table("attendance")\
        .select("*")\
        .eq("doctor_id", doctor_id)\
        .eq("date", today)\
        .execute()
    if existing.data:
        return {"success": False, "message": "Attendance already marked today", "attendance": existing.data[0]}
    now = datetime.now(timezone.utc).isoformat()
    res = supabase.table("attendance").insert({
        "doctor_id": doctor_id,
        "hospital_id": hospital_id,
        "date": today,
        "status": "present",
        "marked_at": now
    }).execute()
    return {"success": True, "attendance": res.data[0]}

@app.get("/doctor/attendance/today/{doctor_id}")
def get_today_attendance(doctor_id: int):
    from datetime import datetime, timezone
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    res = supabase.table("attendance")\
        .select("*")\
        .eq("doctor_id", doctor_id)\
        .eq("date", today)\
        .execute()
    return res.data[0] if res.data else None

@app.get("/doctor/attendance/{hospital_id}")
def get_hospital_attendance(hospital_id: int):
    from datetime import datetime, timezone
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    res = supabase.table("attendance")\
        .select("*")\
        .eq("hospital_id", hospital_id)\
        .eq("date", today)\
        .execute()
    return res.data

# ── Patient Routes ────────────────────────────────────────────
@app.post("/patient/register")
async def patient_register(data: dict):
    required = ["full_name", "aadhar_last4", "age", "gender", "address", "mobile", "password"]
    for field in required:
        if not data.get(field):
            return {"success": False, "message": f"'{field}' is required."}

    mobile       = str(data["mobile"]).strip()
    aadhar_last4 = str(data["aadhar_last4"]).strip()
    password     = str(data["password"]).strip()

    if not mobile.isdigit() or len(mobile) != 10:
        return {"success": False, "message": "Enter a valid 10-digit mobile number."}
    if not aadhar_last4.isdigit() or len(aadhar_last4) != 4:
        return {"success": False, "message": "Enter last 4 digits of Aadhaar."}
    if len(password) < 6:
        return {"success": False, "message": "Password must be at least 6 characters."}

    existing = supabase.table("patients").select("uid").eq("mobile", mobile).execute()
    if existing.data:
        return {"success": False, "message": "This mobile number is already registered. Please login."}

    district_id = None
    if data.get("district_name"):
        dist = supabase.table("districts").select("id").ilike("name", data["district_name"]).execute()
        if dist.data:
            district_id = dist.data[0]["id"]

    try:
        res = supabase.table("patients").insert({
            "full_name":    data["full_name"].strip(),
            "aadhar_last4": aadhar_last4,
            "age":          int(data["age"]),
            "gender":       data["gender"],
            "blood_group":  data.get("blood_group") or None,
            "mobile":       mobile,
            "address":      data["address"].strip(),
            "district_id":  district_id,
            "password":     _hash_password(password),
            "allergies":    data.get("allergies") or None,
            "conditions":   data.get("conditions") or None,
        }).execute()

        patient = res.data[0]
        uid = patient["uid"]

        # ── SMS পাঠাও registration-এর পরে ──────────────────
        # ── SMS পাঠাও registration-এর পরে ──────────────────
        sms_text = f"DHIS Patient ID: {uid} | Name: {patient['full_name']} | Keep this ID safe to access your health records."
        await send_sms(mobile, sms_text)
        # ────────────────────────────────────────────────────

        patient.pop("password", None)
        return {"success": True, "patient": patient, "uid": uid}
    except Exception as e:
        return {"success": False, "message": str(e)}


@app.post("/patient/login")
def patient_login(data: dict):
    uid      = str(data.get("uid", "")).strip().upper()
    password = str(data.get("password", "")).strip()

    if not uid or not password:
        return {"success": False, "message": "Patient ID and password are required."}

    res = supabase.table("patients")\
        .select("*, districts(name)")\
        .eq("uid", uid)\
        .execute()

    if not res.data:
        return {"success": False, "message": "Patient ID not found."}

    patient = res.data[0]
    if patient["password"] != _hash_password(password):
        return {"success": False, "message": "Incorrect password."}

    patient.pop("password", None)
    return {"success": True, "patient": patient}


@app.get("/patient/{uid}")
def get_patient(uid: str):
    res = supabase.table("patients")\
        .select("*, districts(name)")\
        .eq("uid", uid.upper())\
        .execute()
    if not res.data:
        return {"success": False, "message": "Patient not found."}
    patient = res.data[0]
    patient.pop("password", None)
    return {"success": True, "patient": patient}


@app.get("/patient/{uid}/visits")
def get_patient_visits(uid: str):
    pat = supabase.table("patients").select("id").eq("uid", uid.upper()).execute()
    if not pat.data:
        return []
    pid = pat.data[0]["id"]
    res = supabase.table("patient_visits")\
        .select("*, doctors(name, specialization), hospitals(hospital_name)")\
        .eq("patient_id", pid)\
        .order("visited_at", desc=True)\
        .execute()
    return res.data


@app.post("/patient/{uid}/visit")
def add_patient_visit(uid: str, data: dict):
    pat = supabase.table("patients").select("id").eq("uid", uid.upper()).execute()
    if not pat.data:
        return {"success": False, "message": "Patient not found."}
    pid = pat.data[0]["id"]

    doctor_id = None
    if data.get("doctor_name"):
        dr = supabase.table("doctors").select("id")\
            .ilike("name", f"%{data['doctor_name']}%").execute()
        if dr.data:
            doctor_id = dr.data[0]["id"]

    hospital_id = None
    if data.get("hospital_name"):
        hosp = supabase.table("hospitals").select("id")\
            .ilike("hospital_name", f"%{data['hospital_name']}%").execute()
        if hosp.data:
            hospital_id = hosp.data[0]["id"]

    medicines_raw = data.get("medicines_raw", "")
    medicines = [m.strip() for m in medicines_raw.split(",") if m.strip()] if medicines_raw else []

    res = supabase.table("patient_visits").insert({
        "patient_id":    pid,
        "doctor_id":     doctor_id,
        "hospital_id":   hospital_id,
        "doctor_name":   data.get("doctor_name", ""),
        "hospital_name": data.get("hospital_name") or None,
        "diagnosis":     data.get("diagnosis", ""),
        "medicines":     medicines,
        "notes":         data.get("notes") or None,
    }).execute()

    return {"success": True, "visit": res.data[0]}


@app.get("/patients")
def get_all_patients():
    res = supabase.table("patients")\
        .select("*, districts(name)")\
        .order("created_at", desc=True)\
        .execute()
    return res.data


@app.delete("/patient/visit/{visit_id}")
def delete_patient_visit(visit_id: str):
    supabase.table("patient_visits").delete().eq("id", visit_id).execute()
    return {"success": True}


# ── Prescription Routes ─────────────────────────────────────────
PRESCRIPTION_BUCKET = "prescriptions"

@app.post("/patient/{uid}/prescription/upload")
async def upload_prescription(uid: str, file: UploadFile = File(...)):
    uid = uid.upper()
    pat = supabase.table("patients").select("id").eq("uid", uid).execute()
    if not pat.data:
        return {"success": False, "message": "Patient not found."}

    try:
        file_bytes = await file.read()
        safe_name = file.filename.replace(" ", "_")
        storage_path = f"{uid}/{uuid.uuid4().hex}_{safe_name}"

        supabase.storage.from_(PRESCRIPTION_BUCKET).upload(
            storage_path,
            file_bytes,
            {"content-type": file.content_type or "application/octet-stream"},
        )
        file_url = supabase.storage.from_(PRESCRIPTION_BUCKET).get_public_url(storage_path)

        res = supabase.table("prescriptions").insert({
            "patient_uid": uid,
            "file_name": file.filename,
            "file_url": file_url,
            "storage_path": storage_path,
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
        }).execute()

        return {"success": True, "prescription": res.data[0]}
    except Exception as e:
        return {"success": False, "message": str(e)}


@app.get("/patient/{uid}/prescriptions")
def get_prescriptions(uid: str):
    res = supabase.table("prescriptions")\
        .select("*")\
        .eq("patient_uid", uid.upper())\
        .order("uploaded_at", desc=True)\
        .execute()
    return res.data


@app.delete("/patient/prescription/{prescription_id}")
def delete_prescription(prescription_id: str):
    row = supabase.table("prescriptions").select("storage_path").eq("id", prescription_id).execute()
    if row.data:
        storage_path = row.data[0].get("storage_path")
        if storage_path:
            try:
                supabase.storage.from_(PRESCRIPTION_BUCKET).remove([storage_path])
            except Exception:
                pass
    supabase.table("prescriptions").delete().eq("id", prescription_id).execute()
    return {"success": True}
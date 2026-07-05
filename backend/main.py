from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
import pandas as pd
import os
from dotenv import load_dotenv
import google.generativeai as genai
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
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

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

    system_prompt = f"""You are a medical assistant for DHIS - District Health Intelligence System in West Bengal, India.
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
- ⚠️ Please consult a doctor immediately."""

    try:
        model = genai.GenerativeModel(
            model_name="gemini-flash-latest",
            system_instruction=system_prompt,
        )
        result = model.generate_content(f"Patient symptoms: {symptoms}")
        return {"response": result.text}
    except Exception as e:
        return {"response": f"Sorry, the AI assistant is temporarily unavailable. ({e})"}

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

    system_prompt = f"""You are DHIS AI Assistant for West Bengal District Health Intelligence System.
Current district: {district_name}
Real-time health data:
- Total cases: {total_cases}
- Top disease: {top_disease}
- Disease breakdown: {disease_breakdown}
- Total doctors: {total_doctors}
- Available doctors: {available_doctors}
- Hospitals: {', '.join(hospital_names)}

Answer health questions based on this real data. Be concise and helpful.
Always suggest consulting real doctors for medical advice."""

    try:
        model = genai.GenerativeModel(
            model_name="gemini-flash-latest",
            system_instruction=system_prompt,
        )
        result = model.generate_content(question)
        return {"response": result.text}
    except Exception as e:
        return {"response": f"Sorry, the AI assistant is temporarily unavailable. ({e})"}

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


# ── Hospital Login ───────────────────────────────────────────────
@app.post("/hospital/login")
def hospital_login(data: dict):
    username = str(data.get("username", "")).strip()
    password = str(data.get("password", "")).strip()
    if not username or not password:
        return {"success": False, "message": "Username and password are required."}

    res = supabase.table("hospitals")\
        .select("*")\
        .eq("login_username", username)\
        .execute()

    if not res.data or res.data[0].get("login_password") != _hash_password(password):
        return {"success": False, "message": "Invalid username or password."}

    hospital = res.data[0]
    hospital.pop("login_password", None)
    return {"success": True, "hospital": hospital}


# ── Appointment Routes ───────────────────────────────────────────
import random
import string

def _generate_appointment_code():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

@app.post("/appointment/book")
def book_appointment(data: dict):
    patient_uid = str(data.get("patient_uid", "")).upper().strip()
    hospital_id = data.get("hospital_id")
    district_id = data.get("district_id")
    department = data.get("department")
    doctor_name = data.get("doctor_name")
    appointment_date = data.get("appointment_date")
    appointment_time = data.get("appointment_time")

    if not all([patient_uid, hospital_id, district_id, department, doctor_name, appointment_date, appointment_time]):
        return {"success": False, "message": "All fields are required."}

    pat = supabase.table("patients").select("id").eq("uid", patient_uid).execute()
    if not pat.data:
        return {"success": False, "message": "Patient not found."}

    code = _generate_appointment_code()
    for _ in range(5):
        existing = supabase.table("appointments").select("id").eq("appointment_code", code).execute()
        if not existing.data:
            break
        code = _generate_appointment_code()

    res = supabase.table("appointments").insert({
        "appointment_code": code,
        "patient_uid": patient_uid,
        "district_id": district_id,
        "hospital_id": hospital_id,
        "department": department,
        "doctor_name": doctor_name,
        "appointment_date": appointment_date,
        "appointment_time": appointment_time,
        "status": "Pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    return {"success": True, "appointment": res.data[0]}


@app.get("/patient/{uid}/appointments")
def get_patient_appointments(uid: str):
    res = supabase.table("appointments")\
        .select("*, hospitals(hospital_name, address)")\
        .eq("patient_uid", uid.upper())\
        .order("created_at", desc=True)\
        .execute()
    return res.data


@app.post("/appointment/{appointment_id}/cancel")
def cancel_appointment(appointment_id: str):
    supabase.table("appointments").update({"status": "Cancelled"}).eq("id", appointment_id).execute()
    return {"success": True}


@app.get("/appointment/verify/{code}")
def verify_appointment(code: str, hospital_id: int):
    code = code.upper().strip()
    apt_res = supabase.table("appointments").select("*").eq("appointment_code", code).execute()
    if not apt_res.data:
        return {"success": False, "message": "Invalid appointment code."}

    appointment = apt_res.data[0]
    if appointment["hospital_id"] != hospital_id:
        return {"success": False, "message": "This code was not booked at your hospital."}

    if appointment["status"] == "Cancelled":
        return {"success": False, "message": "This appointment has been cancelled by the patient."}

    pat_res = supabase.table("patients").select("*").eq("uid", appointment["patient_uid"]).execute()
    if not pat_res.data:
        return {"success": False, "message": "Patient record not found."}
    patient = pat_res.data[0]
    patient.pop("password", None)

    hosp_res = supabase.table("hospitals").select("hospital_name, address").eq("id", hospital_id).execute()
    hospital = hosp_res.data[0] if hosp_res.data else {}

    return {"success": True, "appointment": appointment, "patient": patient, "hospital": hospital}


@app.post("/appointment/{code}/complete")
def complete_appointment(code: str, data: dict):
    code = code.upper().strip()
    hospital_id = data.get("hospital_id")
    doctor_name = str(data.get("doctor_name", "")).strip()

    if not doctor_name:
        return {"success": False, "message": "Doctor name is required."}

    apt_res = supabase.table("appointments").select("*").eq("appointment_code", code).execute()
    if not apt_res.data:
        return {"success": False, "message": "Invalid appointment code."}

    appointment = apt_res.data[0]
    if appointment["hospital_id"] != hospital_id:
        return {"success": False, "message": "This code was not booked at your hospital."}

    now = datetime.now(timezone.utc).isoformat()
    upd = supabase.table("appointments").update({
        "status": "Completed",
        "verified_doctor_name": doctor_name,
        "verified_at": now,
    }).eq("id", appointment["id"]).execute()

    pat_res = supabase.table("patients").select("*").eq("uid", appointment["patient_uid"]).execute()
    patient = pat_res.data[0] if pat_res.data else {}
    patient.pop("password", None)

    hosp_res = supabase.table("hospitals").select("hospital_name, address").eq("id", hospital_id).execute()
    hospital = hosp_res.data[0] if hosp_res.data else {}

    return {"success": True, "appointment": upd.data[0], "patient": patient, "hospital": hospital}


# ── Admin: Password ────────────────────────────────────────────
def _get_admin_row():
    row = supabase.table("admin_settings").select("*").eq("id", 1).execute()
    if not row.data:
        default_pw = os.getenv("ADMIN_PASSWORD_DEFAULT", "dhis2025")
        supabase.table("admin_settings").insert({
            "id": 1, "password_hash": _hash_password(default_pw)
        }).execute()
        row = supabase.table("admin_settings").select("*").eq("id", 1).execute()
    return row.data[0]

@app.post("/admin/login")
def admin_login(data: dict):
    password = str(data.get("password", "")).strip()
    admin = _get_admin_row()
    if admin["password_hash"] != _hash_password(password):
        return {"success": False, "message": "Invalid password."}
    return {"success": True}

@app.post("/admin/change-password")
def admin_change_password(data: dict):
    old_password = str(data.get("old_password", "")).strip()
    new_password = str(data.get("new_password", "")).strip()
    if len(new_password) < 4:
        return {"success": False, "message": "New password must be at least 4 characters."}
    admin = _get_admin_row()
    if admin["password_hash"] != _hash_password(old_password):
        return {"success": False, "message": "Current password is incorrect."}
    supabase.table("admin_settings").update({
        "password_hash": _hash_password(new_password)
    }).eq("id", 1).execute()
    return {"success": True}


# ── Admin: Districts ────────────────────────────────────────────
@app.post("/admin/districts")
def admin_add_district(data: dict):
    res = supabase.table("districts").insert({
        "name": data.get("name"),
        "population": data.get("population") or None,
        "latitude": data.get("latitude") or None,
        "longitude": data.get("longitude") or None,
    }).execute()
    return {"success": True, "district": res.data[0]}

@app.put("/admin/districts/{district_id}")
def admin_update_district(district_id: int, data: dict):
    supabase.table("districts").update({
        "name": data.get("name"),
        "population": data.get("population") or None,
        "latitude": data.get("latitude") or None,
        "longitude": data.get("longitude") or None,
    }).eq("id", district_id).execute()
    return {"success": True}

@app.delete("/admin/districts/{district_id}")
def admin_delete_district(district_id: int):
    supabase.table("districts").delete().eq("id", district_id).execute()
    return {"success": True}


# ── Admin: Hospitals ────────────────────────────────────────────
@app.get("/admin/hospitals")
def admin_get_hospitals():
    res = supabase.table("hospitals").select("*, districts(name)").order("hospital_name").execute()
    return res.data

@app.post("/admin/hospitals")
def admin_add_hospital(data: dict):
    res = supabase.table("hospitals").insert({
        "hospital_name": data.get("hospital_name"),
        "district_id": data.get("district_id"),
        "address": data.get("address"),
        "total_doctors": data.get("total_doctors") or 0,
        "available_doctors": data.get("available_doctors") or 0,
    }).execute()
    return {"success": True, "hospital": res.data[0]}

@app.put("/admin/hospitals/{hospital_id}")
def admin_update_hospital(hospital_id: int, data: dict):
    supabase.table("hospitals").update({
        "hospital_name": data.get("hospital_name"),
        "district_id": data.get("district_id"),
        "address": data.get("address"),
        "total_doctors": data.get("total_doctors") or 0,
        "available_doctors": data.get("available_doctors") or 0,
    }).eq("id", hospital_id).execute()
    return {"success": True}

@app.delete("/admin/hospitals/{hospital_id}")
def admin_delete_hospital(hospital_id: int):
    supabase.table("hospitals").delete().eq("id", hospital_id).execute()
    return {"success": True}


# ── Admin: Departments (per hospital, controls bed counts) ──────
@app.post("/admin/departments")
def admin_add_department(data: dict):
    res = supabase.table("departments").insert({
        "hospital_id": data.get("hospital_id"),
        "department_name": data.get("department_name"),
        "total_beds": data.get("total_beds") or 0,
        "available_beds": data.get("available_beds") or 0,
    }).execute()
    return {"success": True, "department": res.data[0]}

@app.put("/admin/departments/{department_id}")
def admin_update_department(department_id: int, data: dict):
    supabase.table("departments").update({
        "department_name": data.get("department_name"),
        "total_beds": data.get("total_beds") or 0,
        "available_beds": data.get("available_beds") or 0,
    }).eq("id", department_id).execute()
    return {"success": True}

@app.delete("/admin/departments/{department_id}")
def admin_delete_department(department_id: int):
    supabase.table("departments").delete().eq("id", department_id).execute()
    return {"success": True}


# ── Admin: Doctors ──────────────────────────────────────────────
import re as _re
import random as _random
import string as _string

def _slugify_hospital(name: str) -> str:
    name = _re.sub(r"\bhospital\b", "", name or "", flags=_re.I).strip()
    return _re.sub(r"[^A-Za-z0-9]", "", name) or "HOSP"

def _slugify_doctor(name: str) -> str:
    name = _re.sub(r"^dr\.?\s*", "", name or "", flags=_re.I).strip()
    return _re.sub(r"[^A-Za-z0-9]", "", name) or "DOC"

def _random_password(length: int = 8) -> str:
    chars = _string.ascii_letters + _string.digits
    return "".join(_random.choice(chars) for _ in range(length))

@app.get("/admin/doctors")
def admin_get_doctors():
    res = supabase.table("doctors").select("*, hospitals(hospital_name)").order("name").execute()
    return res.data

@app.post("/admin/doctors")
def admin_add_doctor(data: dict):
    hospital_id = data.get("hospital_id")
    name = data.get("name", "").strip()
    hosp = supabase.table("hospitals").select("hospital_name").eq("id", hospital_id).execute()
    hospital_name = hosp.data[0]["hospital_name"] if hosp.data else "Hospital"

    base_id = f"{_slugify_hospital(hospital_name)}_{_slugify_doctor(name)}"
    existing_ids = {d["unique_id"] for d in supabase.table("doctors").select("unique_id").execute().data if d.get("unique_id")}
    unique_id = base_id
    n = 2
    while unique_id in existing_ids:
        unique_id = f"{base_id}{n}"
        n += 1

    password = _random_password()

    res = supabase.table("doctors").insert({
        "name": name,
        "specialization": data.get("specialization"),
        "hospital_id": hospital_id,
        "unique_id": unique_id,
        "password": password,
    }).execute()

    doctor = res.data[0]
    doctor["_plaintext_password"] = password  # shown once to admin, not stored elsewhere
    return {"success": True, "doctor": doctor}

@app.put("/admin/doctors/{doctor_id}")
def admin_update_doctor(doctor_id: int, data: dict):
    supabase.table("doctors").update({
        "name": data.get("name"),
        "specialization": data.get("specialization"),
        "hospital_id": data.get("hospital_id"),
    }).eq("id", doctor_id).execute()
    return {"success": True}

@app.post("/admin/doctors/{doctor_id}/reset-password")
def admin_reset_doctor_password(doctor_id: int):
    password = _random_password()
    supabase.table("doctors").update({"password": password}).eq("id", doctor_id).execute()
    return {"success": True, "password": password}

@app.delete("/admin/doctors/{doctor_id}")
def admin_delete_doctor(doctor_id: int):
    supabase.table("doctors").delete().eq("id", doctor_id).execute()
    return {"success": True}


# ── Admin: Patients ─────────────────────────────────────────────
@app.get("/admin/patients")
def admin_get_patients():
    res = supabase.table("patients")\
        .select("id, uid, full_name, age, gender, blood_group, mobile, address, district_id, allergies, conditions, districts(name)")\
        .order("full_name")\
        .execute()
    return res.data

@app.put("/admin/patients/{uid}")
def admin_update_patient(uid: str, data: dict):
    update_data = {k: v for k, v in {
        "full_name": data.get("full_name"),
        "age": data.get("age"),
        "gender": data.get("gender"),
        "blood_group": data.get("blood_group"),
        "mobile": data.get("mobile"),
        "address": data.get("address"),
        "district_id": data.get("district_id"),
        "allergies": data.get("allergies"),
        "conditions": data.get("conditions"),
    }.items() if v is not None}
    supabase.table("patients").update(update_data).eq("uid", uid.upper()).execute()
    return {"success": True}

@app.delete("/admin/patients/{uid}")
def admin_delete_patient(uid: str):
    supabase.table("patients").delete().eq("uid", uid.upper()).execute()
    return {"success": True}
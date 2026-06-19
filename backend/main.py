from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
import pandas as pd
import os
from dotenv import load_dotenv
import anthropic

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

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

# ── Doctor Routes ──────────────────────────────────────────

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

# ============================================================
# patient_routes_fast2sms.py
# main.py-এর শেষে এই পুরো block paste করো
# ============================================================

import random
import time
import httpx  # already available with FastAPI

# ── Fast2SMS config (from .env) ──────────────────────────────
FAST2SMS_KEY = os.getenv("FAST2SMS_API_KEY")  # .env-এ add করো

# ── In-memory OTP store ──────────────────────────────────────
# { "9876543210": { "otp": "482910", "expires": 1700000000 } }
_otp_store: dict = {}


async def _send_sms_fast2sms(mobile: str, otp: str) -> bool:
    """Send OTP SMS via Fast2SMS DLT-free route."""
    url = "https://www.fast2sms.com/dev/bulkV2"
    headers = {"authorization": FAST2SMS_KEY}
    params = {
        "variables_values": otp,
        "route": "otp",          # Fast2SMS OTP route — DLT registration lagbe na
        "numbers": mobile,       # 10-digit Indian number
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(url, headers=headers, params=params)
            data = res.json()
            print(f"[Fast2SMS] {data}")
            return data.get("return", False)
    except Exception as e:
        print(f"[Fast2SMS Error] {e}")
        return False


# ── 1. SEND OTP ──────────────────────────────────────────────
@app.post("/patient/send-otp")
async def send_otp(data: dict):
    mobile = data.get("mobile", "").strip()

    if not mobile.isdigit() or len(mobile) != 10:
        return {"success": False, "message": "Valid 10-digit mobile number dao"}

    # Already registered check
    existing = supabase.table("patients").select("uid").eq("mobile", mobile).execute()
    if existing.data:
        return {
            "success": False,
            "message": "Ei number diye already registration ache!",
            "already_registered": True,
            "uid": existing.data[0]["uid"]
        }

    # Generate OTP
    otp = str(random.randint(100000, 999999))
    expires = time.time() + 300  # 5 minutes

    _otp_store[mobile] = {"otp": otp, "expires": expires}

    # Send SMS
    sent = await _send_sms_fast2sms(mobile, otp)

    if not sent:
        return {"success": False, "message": "SMS pathano jacche na. Fast2SMS API key check koro."}

    return {
        "success": True,
        "message": f"✅ OTP pathano hoyeche +91{mobile} number-e. 5 minutes-er modhye dao."
    }


# ── 2. VERIFY OTP ────────────────────────────────────────────
@app.post("/patient/verify-otp")
def verify_otp(data: dict):
    mobile = data.get("mobile", "").strip()
    otp    = data.get("otp", "").strip()

    stored = _otp_store.get(mobile)

    if not stored:
        return {"success": False, "verified": False, "message": "OTP paoua jacche na. Abar pathao."}

    if time.time() > stored["expires"]:
        _otp_store.pop(mobile, None)
        return {"success": False, "verified": False, "message": "OTP expire hoe geche (5 min). Abar pathao."}

    if stored["otp"] != otp:
        return {"success": False, "verified": False, "message": "OTP ta thik nei. Abar check koro."}

    _otp_store.pop(mobile, None)
    return {"success": True, "verified": True, "message": "OTP verified!"}


# ── 3. REGISTER PATIENT ──────────────────────────────────────
@app.post("/patient/register")
def register_patient(data: dict):
    required = ["full_name", "aadhar_last4", "age", "gender", "mobile", "address"]
    for field in required:
        if not data.get(field):
            return {"success": False, "message": f"'{field}' field missing"}

    mobile       = data["mobile"].strip()
    aadhar_last4 = data["aadhar_last4"].strip()

    if not mobile.isdigit() or len(mobile) != 10:
        return {"success": False, "message": "Invalid mobile number"}
    if not aadhar_last4.isdigit() or len(aadhar_last4) != 4:
        return {"success": False, "message": "Aadhaar last 4 digits must be 4 numbers"}

    # Resolve district_id
    district_id = None
    district_name = data.get("district_name", "")
    if district_name:
        dist_res = supabase.table("districts").select("id").ilike("name", district_name).execute()
        if dist_res.data:
            district_id = dist_res.data[0]["id"]

    insert_payload = {
        "uid":          "",           # trigger auto-generates
        "full_name":    data["full_name"].strip(),
        "aadhar_last4": aadhar_last4,
        "age":          int(data["age"]),
        "gender":       data["gender"],
        "blood_group":  data.get("blood_group") or None,
        "mobile":       mobile,
        "address":      data["address"].strip(),
        "district_id":  district_id,
        "allergies":    data.get("allergies") or None,
        "conditions":   data.get("conditions") or None,
    }

    try:
        res = supabase.table("patients").insert(insert_payload).execute()
        patient = res.data[0]
        return {"success": True, "patient": patient, "uid": patient["uid"]}
    except Exception as e:
        return {"success": False, "message": str(e)}


# ── 4. GET PATIENT BY UID ────────────────────────────────────
@app.get("/patient/{uid}")
def get_patient(uid: str):
    res = supabase.table("patients")\
        .select("*, districts(name)")\
        .eq("uid", uid.upper())\
        .execute()
    if not res.data:
        return {"success": False, "message": "Patient paoua jacche na"}
    return {"success": True, "patient": res.data[0]}


# ── 5. GET PATIENT VISITS ────────────────────────────────────
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


# ── 6. ADD VISIT / PRESCRIPTION ─────────────────────────────
@app.post("/patient/{uid}/visit")
def add_patient_visit(uid: str, data: dict):
    pat = supabase.table("patients").select("id").eq("uid", uid.upper()).execute()
    if not pat.data:
        return {"success": False, "message": "Patient not found"}
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


# ── 7. GET ALL PATIENTS ──────────────────────────────────────
@app.get("/patients")
def get_all_patients():
    res = supabase.table("patients")\
        .select("*, districts(name)")\
        .order("created_at", desc=True)\
        .execute()
    return res.data


# ── 8. DELETE VISIT ──────────────────────────────────────────
@app.delete("/patient/visit/{visit_id}")
def delete_patient_visit(visit_id: str):
    supabase.table("patient_visits").delete().eq("id", visit_id).execute()
    return {"success": True}

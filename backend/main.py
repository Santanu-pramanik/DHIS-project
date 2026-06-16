from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
import pandas as pd
import os
from dotenv import load_dotenv
import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()

gemini_key = os.getenv("GEMINI_API_KEY")

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

    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = f"""You are a medical assistant for DHIS - District Health Intelligence System in West Bengal, India.
Current district: {district}
Top diseases in this district: {top_diseases}
Available hospitals: {', '.join(hospital_list)}

Patient symptoms: {symptoms}

Based on symptoms, suggest possible diseases and recommend hospitals.
Keep response concise and helpful in simple English.
Format your response as:
- Possible conditions: ...
- Recommended hospital: ...
- Precautions: ...
- ⚠️ Please consult a doctor immediately."""

    response = model.generate_content(prompt)
    return {"response": response.text}


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

    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = f"""You are DHIS AI Assistant for West Bengal District Health Intelligence System.
Current district: {district_name}
Real-time health data:
- Total cases: {total_cases}
- Top disease: {top_disease}
- Disease breakdown: {disease_breakdown}
- Total doctors: {total_doctors}
- Available doctors: {available_doctors}
- Hospitals: {', '.join(hospital_names)}

User question: {question}

Answer based on this real data. Be concise and helpful.
Always suggest consulting real doctors for medical advice."""

    response = model.generate_content(prompt)
    return {"response": response.text}
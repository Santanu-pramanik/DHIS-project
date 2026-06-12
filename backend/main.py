from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
import pandas as pd
import os
from dotenv import load_dotenv

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
    res = supabase.table("disease_cases").insert(data).execute()
    return res.data
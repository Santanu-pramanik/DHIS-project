"""
Run this ONCE (locally, where backend/.env with Supabase keys exists) to set a
login username + password for a hospital so its staff can access the Hospital
Dashboard.

Usage:
    cd backend
    python set_hospital_login.py
"""

import os
import hashlib
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def main():
    hospitals = supabase.table("hospitals").select("id, hospital_name").execute().data
    print("\nHospitals:")
    for h in hospitals:
        print(f"  [{h['id']}] {h['hospital_name']}")

    hospital_id = int(input("\nEnter hospital id to set login for: ").strip())
    username = input("Choose a username (e.g. chinsurah_dh): ").strip()
    password = input("Choose a password: ").strip()

    supabase.table("hospitals").update({
        "login_username": username,
        "login_password": hash_password(password),
    }).eq("id", hospital_id).execute()

    print(f"\nDone. Login with username='{username}' password='{password}' on the Hospital Login page.")


if __name__ == "__main__":
    main()

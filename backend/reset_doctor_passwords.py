"""
Run this to RESET passwords for ALL doctors that already have a unique_id.
The existing unique_id stays exactly the same -- only the password changes.

Usage:
    cd backend
    python reset_doctor_passwords.py

It will print a fresh table of (hospital, doctor, unique_id, new password).
Save this output -- it is never shown again, and old passwords stop working
immediately once this script runs.
"""

import os
import random
import string
import hashlib
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def random_password(length: int = 8) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(random.choice(chars) for _ in range(length))


def main():
    hospitals = {h["id"]: h["hospital_name"] for h in supabase.table("hospitals").select("*").execute().data}
    doctors = supabase.table("doctors").select("*").execute().data

    rows = []
    for d in doctors:
        if not d.get("unique_id"):
            continue  # this doctor never got an ID -- run setup_doctor_credentials.py first

        password = random_password()
        supabase.table("doctors").update({
            "password_hash": hash_password(password)
        }).eq("id", d["id"]).execute()

        hospital_name = hospitals.get(d["hospital_id"], "Hospital")
        rows.append((hospital_name, d["name"], d["unique_id"], password))

    if not rows:
        print("No doctors with an existing unique_id found. Run setup_doctor_credentials.py first.")
        return

    print(f"\nReset password for {len(rows)} doctor(s):\n")
    print(f"{'Hospital':<25} {'Doctor':<22} {'Unique ID':<22} {'New Password'}")
    print("-" * 90)
    for hospital_name, doc_name, unique_id, password in rows:
        print(f"{hospital_name:<25} {doc_name:<22} {unique_id:<22} {password}")

    print("\nSave this list now -- it won't be shown again. Share each doctor's new password with them.")


if __name__ == "__main__":
    main()

"""
Run this ONCE on your own machine (where backend/.env with Supabase keys exists)
to generate a unique login ID + password for every doctor that doesn't have one yet.

Usage:
    cd backend
    python setup_doctor_credentials.py

It will print a table of (hospital, doctor, unique_id, password) -- save this
output somewhere safe and share each doctor's ID/password with them. The
plaintext password is never stored in the database, only its hash.
"""

import os
import re
import random
import string
import hashlib
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def slugify_hospital(name: str) -> str:
    name = re.sub(r"\bhospital\b", "", name, flags=re.I).strip()
    return re.sub(r"[^A-Za-z0-9]", "", name) or "HOSP"


def slugify_doctor(name: str) -> str:
    name = re.sub(r"^dr\.?\s*", "", name, flags=re.I).strip()
    return re.sub(r"[^A-Za-z0-9]", "", name) or "DOC"


def random_password(length: int = 8) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(random.choice(chars) for _ in range(length))


def main():
    hospitals = {h["id"]: h["hospital_name"] for h in supabase.table("hospitals").select("*").execute().data}
    doctors = supabase.table("doctors").select("*").execute().data

    existing_ids = {d["unique_id"] for d in doctors if d.get("unique_id")}
    rows = []

    for d in doctors:
        if d.get("unique_id") and d.get("password_hash"):
            continue  # already set up

        hospital_name = hospitals.get(d["hospital_id"], "Hospital")
        base_id = f"{slugify_hospital(hospital_name)}_{slugify_doctor(d['name'])}"

        unique_id = base_id
        n = 2
        while unique_id in existing_ids:
            unique_id = f"{base_id}{n}"
            n += 1
        existing_ids.add(unique_id)

        password = random_password()

        supabase.table("doctors").update({
            "unique_id": unique_id,
            "password_hash": hash_password(password)
        }).eq("id", d["id"]).execute()

        rows.append((hospital_name, d["name"], unique_id, password))

    if not rows:
        print("All doctors already have login credentials. Nothing to do.")
        return

    print(f"\nGenerated credentials for {len(rows)} doctor(s):\n")
    print(f"{'Hospital':<25} {'Doctor':<22} {'Unique ID':<22} {'Password'}")
    print("-" * 85)
    for hospital_name, doc_name, unique_id, password in rows:
        print(f"{hospital_name:<25} {doc_name:<22} {unique_id:<22} {password}")

    print("\nShare each doctor's Unique ID + Password with them directly. "
          "This list is not saved anywhere else, so copy it now if you need it.")


if __name__ == "__main__":
    main()

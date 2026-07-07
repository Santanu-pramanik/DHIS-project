"""
Run this ONCE (locally, where backend/.env with Supabase keys exists) to
auto-generate a login username + password for EVERY hospital that doesn't
already have one, so all hospitals can access the Hospital Dashboard.

Usage:
    cd backend
    python set_hospital_login.py

It will:
  1. Find every hospital where login_username is empty/NULL
  2. Generate a username from the hospital name (slugified, unique)
  3. Generate a random 6-character password
  4. Save the SHA-256 hash to Supabase (never stores plain text)
  5. Print a table of hospital -> username -> password so you can save it
     somewhere safe (e.g. a spreadsheet) — this is the ONLY time you'll see
     the plain-text passwords.

Hospitals that already have a login_username are left untouched.
"""

import os
import re
import hashlib
import secrets
import string
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
    return slug[:30]


def random_password(length: int = 6) -> str:
    chars = string.ascii_lowercase + string.digits
    return "".join(secrets.choice(chars) for _ in range(length))


def main():
    hospitals = supabase.table("hospitals").select("id, hospital_name, login_username").execute().data
    pending = [h for h in hospitals if not h.get("login_username")]

    if not pending:
        print("Every hospital already has a login. Nothing to do.")
        return

    print(f"Found {len(pending)} hospital(s) without a login. Generating credentials...\n")

    existing_usernames = {h["login_username"] for h in hospitals if h.get("login_username")}
    results = []

    for h in pending:
        base_username = slugify(h["hospital_name"])
        username = base_username
        suffix = 1
        while username in existing_usernames:
            suffix += 1
            username = f"{base_username}{suffix}"
        existing_usernames.add(username)

        password = random_password()

        supabase.table("hospitals").update({
            "login_username": username,
            "login_password": hash_password(password),
        }).eq("id", h["id"]).execute()

        results.append((h["hospital_name"], username, password))

    print(f"{'Hospital':<40} {'Username':<20} {'Password'}")
    print("-" * 75)
    for name, username, password in results:
        print(f"{name[:38]:<40} {username:<20} {password}")

    print("\nDone. SAVE THIS LIST NOW — passwords are hashed in the database")
    print("and cannot be recovered later; you'd have to reset them again.")


if __name__ == "__main__":
    main()


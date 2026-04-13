"""Script to create an admin user."""
import asyncio
import asyncpg
import os
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not set")
        return
    
    conn = await asyncpg.connect(db_url)
    
    email = input("Admin email: ")
    full_name = input("Full name: ")
    password = input("Password: ")
    
    hashed = pwd_context.hash(password)
    
    try:
        await conn.execute("""
            INSERT INTO users (id, email, full_name, hashed_password, role)
            VALUES (gen_random_uuid(), $1, $2, $3, 'admin')
        """, email, full_name, hashed)
        print(f"Admin user created: {email}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(create_admin())

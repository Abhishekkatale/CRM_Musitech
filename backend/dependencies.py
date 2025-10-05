from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import Depends
import os

# This will be set by the main application
_database = None

def set_database(db: AsyncIOMotorDatabase):
    """Set the database instance"""
    global _database
    _database = db

def get_database() -> AsyncIOMotorDatabase:
    """Get database dependency"""
    if _database is None:
        raise RuntimeError("Database not initialized")
    return _database
import pymongo
from pymongo import MongoClient

def test_mongo_connection():
    try:
        client = MongoClient('mongodb://server:27017/', serverSelectionTimeoutMS=5000)
        client.close()
        
        assert True, "MongoDB is running"
        print("MongoDB is up and running")
        
    except pymongo.errors.ServerSelectionTimeoutError:
        assert False, "MongoDB is not accessible - connection timeout"
    except Exception as e:
        assert False, f"MongoDB connection failed: {str(e)}"

if __name__ == "__main__":
    test_mongo_connection()
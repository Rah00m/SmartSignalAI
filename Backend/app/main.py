from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .ecg import ecg_router  

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ecg_router, prefix="/ecg", tags=["ECG"])

@app.get("/")
def root():
    return {"message": "Welcome to ECG API"}

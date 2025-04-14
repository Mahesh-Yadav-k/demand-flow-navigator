
"""
FastAPI Backend for Resource Management Application

This file contains a complete FastAPI implementation with SQLite database
that mirrors the frontend's API requirements.

To run this backend:
1. Install dependencies: pip install fastapi[all] sqlalchemy pydantic python-multipart uvicorn
2. Start the server: uvicorn backend_code:app --reload

The server will be available at http://localhost:8000
API documentation will be at http://localhost:8000/docs
"""

import os
import datetime
from typing import List, Optional, Dict, Any, Union
from enum import Enum

from fastapi import FastAPI, HTTPException, Query, Path, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from sqlalchemy import create_engine, Column, Integer, String, Date, ForeignKey, Text, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship


# ================ Database Layer ================

# Define database connection
DATABASE_URL = "sqlite:///./resource_management.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ================ Database Models ================

class AccountModel(Base):
    """SQLAlchemy model for Accounts table"""
    __tablename__ = "accounts"

    id = Column(String, primary_key=True, index=True)  # Oppty ID
    client = Column(String, index=True)
    project = Column(String, index=True)
    vertical = Column(String)
    geo = Column(String)
    start_month = Column(String)
    revised_start_date = Column(Date, nullable=True)
    planned_start_date = Column(Date, nullable=True)
    planned_end_date = Column(Date, nullable=True)
    probability = Column(Integer)  # 50, 75, 90, 100
    opportunity_status = Column(String)
    sow_status = Column(String)
    project_status = Column(String)
    client_partner = Column(String)
    proposal_anchor = Column(String)
    delivery_partner = Column(String)
    comment = Column(Text, nullable=True)
    last_updated_by = Column(String)
    updated_on = Column(Date)
    added_by = Column(String)
    added_on = Column(Date)

    # Relationship with Demands
    demands = relationship("DemandModel", back_populates="account")


class DemandModel(Base):
    """SQLAlchemy model for Demands table"""
    __tablename__ = "demands"

    sno = Column(Integer, primary_key=True, autoincrement=True)
    id = Column(String, unique=True, index=True)  # Client-facing ID
    account_id = Column(String, ForeignKey("accounts.id"), index=True)
    project = Column(String, index=True)
    role = Column(String, index=True)
    role_code = Column(String)
    location = Column(String)
    revised = Column(String, nullable=True)
    original_start_date = Column(Date, nullable=True)
    allocation_end_date = Column(Date, nullable=True)
    allocation_percentage = Column(Integer)  # Allocation %
    probability = Column(Integer)
    status = Column(String)
    resource_mapped = Column(String, nullable=True)
    comment = Column(Text, nullable=True)
    last_updated_by = Column(String)
    updated_on = Column(Date)
    added_by = Column(String)
    added_on = Column(Date)
    start_month = Column(String)

    # Relationship with Accounts
    account = relationship("AccountModel", back_populates="demands")


# Create the tables in the database
Base.metadata.create_all(bind=engine)


# ================ Schema Layer (Pydantic Models) ================

class ProbabilityEnum(int, Enum):
    FIFTY = 50
    SEVENTY_FIVE = 75
    NINETY = 90
    HUNDRED = 100


class AccountBase(BaseModel):
    """Base model for Account data validation"""
    client: str
    project: str
    vertical: str
    geo: str
    start_month: str
    revised_start_date: Optional[str] = None
    planned_start_date: Optional[str] = None
    planned_end_date: Optional[str] = None
    probability: ProbabilityEnum
    opportunity_status: str
    sow_status: str
    project_status: str
    client_partner: str
    proposal_anchor: str
    delivery_partner: str
    comment: Optional[str] = None
    
    @validator('probability')
    def validate_probability(cls, v):
        """Validate that probability is one of the allowed values"""
        allowed = [50, 75, 90, 100]
        if v not in allowed:
            raise ValueError(f'Probability must be one of {allowed}')
        return v


class AccountCreate(AccountBase):
    """Model for creating a new Account"""
    # No additional fields for creation


class AccountUpdate(AccountBase):
    """Model for updating an existing Account"""
    # Make all fields optional for partial updates
    client: Optional[str] = None
    project: Optional[str] = None
    vertical: Optional[str] = None
    geo: Optional[str] = None
    start_month: Optional[str] = None
    probability: Optional[ProbabilityEnum] = None
    opportunity_status: Optional[str] = None
    sow_status: Optional[str] = None
    project_status: Optional[str] = None
    client_partner: Optional[str] = None
    proposal_anchor: Optional[str] = None
    delivery_partner: Optional[str] = None


class Account(AccountBase):
    """Complete Account model with database fields"""
    id: str
    last_updated_by: str
    updated_on: str
    added_by: str
    added_on: str

    class Config:
        orm_mode = True


class DemandBase(BaseModel):
    """Base model for Demand data validation"""
    account_id: str
    project: str
    role: str
    role_code: str
    location: str
    revised: Optional[str] = None
    original_start_date: Optional[str] = None
    allocation_end_date: Optional[str] = None
    allocation_percentage: int
    probability: int
    status: str
    resource_mapped: Optional[str] = None
    comment: Optional[str] = None
    start_month: str


class DemandCreate(DemandBase):
    """Model for creating a new Demand"""
    # No additional fields for creation


class DemandUpdate(DemandBase):
    """Model for updating an existing Demand"""
    # Make all fields optional for partial updates
    account_id: Optional[str] = None
    project: Optional[str] = None
    role: Optional[str] = None
    role_code: Optional[str] = None
    location: Optional[str] = None
    allocation_percentage: Optional[int] = None
    probability: Optional[int] = None
    status: Optional[str] = None
    start_month: Optional[str] = None


class Demand(DemandBase):
    """Complete Demand model with database fields"""
    id: str
    sno: int
    last_updated_by: str
    updated_on: str
    added_by: str
    added_on: str

    class Config:
        orm_mode = True


class ApiResponse(BaseModel):
    """Generic API response wrapper"""
    success: bool
    message: Optional[str] = None
    data: Any


class DashboardStats(BaseModel):
    """Model for dashboard statistics"""
    totalAccounts: int
    totalDemands: int
    accountsByStatus: Dict[str, int]
    demandsByStatus: Dict[str, int]


# ================ Service Layer ================

class AccountService:
    """Service for Account-related operations"""
    
    @staticmethod
    def get_all_accounts(db: Session) -> List[AccountModel]:
        return db.query(AccountModel).all()
    
    @staticmethod
    def get_account_by_id(db: Session, account_id: str) -> Optional[AccountModel]:
        return db.query(AccountModel).filter(AccountModel.id == account_id).first()
    
    @staticmethod
    def create_account(db: Session, account_data: AccountCreate, user_id: str) -> AccountModel:
        # Generate a unique ID
        new_id = f"ACC-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
        now = datetime.datetime.now().date()
        
        # Convert date strings to date objects if not None
        revised_start = None
        if account_data.revised_start_date:
            revised_start = datetime.datetime.strptime(account_data.revised_start_date, "%Y-%m-%d").date()
            
        planned_start = None
        if account_data.planned_start_date:
            planned_start = datetime.datetime.strptime(account_data.planned_start_date, "%Y-%m-%d").date()
            
        planned_end = None
        if account_data.planned_end_date:
            planned_end = datetime.datetime.strptime(account_data.planned_end_date, "%Y-%m-%d").date()
        
        # Create new account instance
        account = AccountModel(
            id=new_id,
            client=account_data.client,
            project=account_data.project,
            vertical=account_data.vertical,
            geo=account_data.geo,
            start_month=account_data.start_month,
            revised_start_date=revised_start,
            planned_start_date=planned_start,
            planned_end_date=planned_end,
            probability=account_data.probability,
            opportunity_status=account_data.opportunity_status,
            sow_status=account_data.sow_status,
            project_status=account_data.project_status,
            client_partner=account_data.client_partner,
            proposal_anchor=account_data.proposal_anchor,
            delivery_partner=account_data.delivery_partner,
            comment=account_data.comment,
            last_updated_by=user_id,
            updated_on=now,
            added_by=user_id,
            added_on=now
        )
        
        db.add(account)
        db.commit()
        db.refresh(account)
        return account
    
    @staticmethod
    def update_account(db: Session, account_id: str, account_data: AccountUpdate, user_id: str) -> Optional[AccountModel]:
        account = db.query(AccountModel).filter(AccountModel.id == account_id).first()
        if not account:
            return None
        
        # Update fields that are provided in the update data
        update_data = account_data.dict(exclude_unset=True)
        
        # Handle date conversions
        if 'revised_start_date' in update_data and update_data['revised_start_date']:
            update_data['revised_start_date'] = datetime.datetime.strptime(
                update_data['revised_start_date'], "%Y-%m-%d").date()
            
        if 'planned_start_date' in update_data and update_data['planned_start_date']:
            update_data['planned_start_date'] = datetime.datetime.strptime(
                update_data['planned_start_date'], "%Y-%m-%d").date()
            
        if 'planned_end_date' in update_data and update_data['planned_end_date']:
            update_data['planned_end_date'] = datetime.datetime.strptime(
                update_data['planned_end_date'], "%Y-%m-%d").date()
            
        # Update audit fields
        update_data['last_updated_by'] = user_id
        update_data['updated_on'] = datetime.datetime.now().date()
        
        # Apply updates
        for key, value in update_data.items():
            setattr(account, key, value)
            
        db.commit()
        db.refresh(account)
        return account
    
    @staticmethod
    def delete_account(db: Session, account_id: str) -> bool:
        account = db.query(AccountModel).filter(AccountModel.id == account_id).first()
        if not account:
            return False
        
        # Check if there are any demands linked to this account
        demands = db.query(DemandModel).filter(DemandModel.account_id == account_id).count()
        if demands > 0:
            return False  # Cannot delete account with linked demands
        
        db.delete(account)
        db.commit()
        return True


class DemandService:
    """Service for Demand-related operations"""
    
    @staticmethod
    def get_all_demands(db: Session) -> List[DemandModel]:
        return db.query(DemandModel).all()
    
    @staticmethod
    def get_demand_by_id(db: Session, demand_id: str) -> Optional[DemandModel]:
        return db.query(DemandModel).filter(DemandModel.id == demand_id).first()
    
    @staticmethod
    def get_demands_by_account(db: Session, account_id: str) -> List[DemandModel]:
        return db.query(DemandModel).filter(DemandModel.account_id == account_id).all()
    
    @staticmethod
    def create_demand(db: Session, demand_data: DemandCreate, user_id: str) -> DemandModel:
        # Verify that the referenced account exists
        account = db.query(AccountModel).filter(AccountModel.id == demand_data.account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Referenced account not found")
        
        # Generate a unique ID
        new_id = f"DEM-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
        now = datetime.datetime.now().date()
        
        # Convert date strings to date objects if not None
        original_start = None
        if demand_data.original_start_date:
            original_start = datetime.datetime.strptime(demand_data.original_start_date, "%Y-%m-%d").date()
            
        allocation_end = None
        if demand_data.allocation_end_date:
            allocation_end = datetime.datetime.strptime(demand_data.allocation_end_date, "%Y-%m-%d").date()
        
        # Create new demand instance
        demand = DemandModel(
            id=new_id,
            account_id=demand_data.account_id,
            project=demand_data.project,
            role=demand_data.role,
            role_code=demand_data.role_code,
            location=demand_data.location,
            revised=demand_data.revised,
            original_start_date=original_start,
            allocation_end_date=allocation_end,
            allocation_percentage=demand_data.allocation_percentage,
            probability=demand_data.probability,
            status=demand_data.status,
            resource_mapped=demand_data.resource_mapped,
            comment=demand_data.comment,
            last_updated_by=user_id,
            updated_on=now,
            added_by=user_id,
            added_on=now,
            start_month=demand_data.start_month
        )
        
        db.add(demand)
        db.commit()
        db.refresh(demand)
        return demand
    
    @staticmethod
    def update_demand(db: Session, demand_id: str, demand_data: DemandUpdate, user_id: str) -> Optional[DemandModel]:
        demand = db.query(DemandModel).filter(DemandModel.id == demand_id).first()
        if not demand:
            return None
        
        # Update fields that are provided in the update data
        update_data = demand_data.dict(exclude_unset=True)
        
        # If account_id is being updated, verify the new account exists
        if 'account_id' in update_data:
            account = db.query(AccountModel).filter(AccountModel.id == update_data['account_id']).first()
            if not account:
                raise HTTPException(status_code=404, detail="Referenced account not found")
        
        # Handle date conversions
        if 'original_start_date' in update_data and update_data['original_start_date']:
            update_data['original_start_date'] = datetime.datetime.strptime(
                update_data['original_start_date'], "%Y-%m-%d").date()
            
        if 'allocation_end_date' in update_data and update_data['allocation_end_date']:
            update_data['allocation_end_date'] = datetime.datetime.strptime(
                update_data['allocation_end_date'], "%Y-%m-%d").date()
            
        # Update audit fields
        update_data['last_updated_by'] = user_id
        update_data['updated_on'] = datetime.datetime.now().date()
        
        # Apply updates
        for key, value in update_data.items():
            setattr(demand, key, value)
            
        db.commit()
        db.refresh(demand)
        return demand
    
    @staticmethod
    def delete_demand(db: Session, demand_id: str) -> bool:
        demand = db.query(DemandModel).filter(DemandModel.id == demand_id).first()
        if not demand:
            return False
        
        db.delete(demand)
        db.commit()
        return True
    
    @staticmethod
    def clone_demand(db: Session, demand_id: str, count: int, user_id: str) -> List[DemandModel]:
        # Find the demand to clone
        source_demand = db.query(DemandModel).filter(DemandModel.id == demand_id).first()
        if not source_demand:
            raise HTTPException(status_code=404, detail="Demand not found")
        
        now = datetime.datetime.now().date()
        clones = []
        
        for i in range(count):
            # Generate a unique ID for the clone
            new_id = f"DEM-CLONE-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}-{i}"
            
            # Create a new demand instance with same data as source
            clone = DemandModel(
                id=new_id,
                account_id=source_demand.account_id,
                project=source_demand.project,
                role=source_demand.role,
                role_code=source_demand.role_code,
                location=source_demand.location,
                revised=source_demand.revised,
                original_start_date=source_demand.original_start_date,
                allocation_end_date=source_demand.allocation_end_date,
                allocation_percentage=source_demand.allocation_percentage,
                probability=source_demand.probability,
                status=source_demand.status,
                resource_mapped=source_demand.resource_mapped,
                comment=source_demand.comment,
                last_updated_by=user_id,
                updated_on=now,
                added_by=user_id,
                added_on=now,
                start_month=source_demand.start_month
            )
            
            db.add(clone)
            clones.append(clone)
        
        db.commit()
        
        # Refresh all clones to get their auto-assigned primary keys
        for clone in clones:
            db.refresh(clone)
            
        return clones


class DashboardService:
    """Service for Dashboard-related operations"""
    
    @staticmethod
    def get_dashboard_stats(db: Session) -> DashboardStats:
        # Count accounts and demands
        total_accounts = db.query(AccountModel).count()
        total_demands = db.query(DemandModel).count()
        
        # Group accounts by opportunity status
        accounts_by_status = {}
        for status, count in db.query(
            AccountModel.opportunity_status, 
            func.count(AccountModel.id)
        ).group_by(AccountModel.opportunity_status).all():
            accounts_by_status[status] = count
        
        # Group demands by status
        demands_by_status = {}
        for status, count in db.query(
            DemandModel.status,
            func.count(DemandModel.id)
        ).group_by(DemandModel.status).all():
            demands_by_status[status] = count
        
        return DashboardStats(
            totalAccounts=total_accounts,
            totalDemands=total_demands,
            accountsByStatus=accounts_by_status,
            demandsByStatus=demands_by_status
        )
    
    @staticmethod
    def search(db: Session, query: str, entity: str) -> Union[List[AccountModel], List[DemandModel]]:
        """Search accounts or demands by query string"""
        if entity == "accounts":
            return db.query(AccountModel).filter(
                AccountModel.client.contains(query) |
                AccountModel.project.contains(query) |
                AccountModel.vertical.contains(query) |
                AccountModel.opportunity_status.contains(query)
            ).all()
        elif entity == "demands":
            return db.query(DemandModel).filter(
                DemandModel.role.contains(query) |
                DemandModel.project.contains(query) |
                DemandModel.location.contains(query) |
                DemandModel.status.contains(query)
            ).all()
        else:
            raise ValueError(f"Invalid entity type: {entity}")


# ================ API Layer (FastAPI Routes) ================

app = FastAPI(title="Resource Management API", version="1.0.0")

# Add CORS middleware to allow frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production to only allow your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple authentication middleware (for production, use a proper auth system)
def get_current_user() -> str:
    # In a real app, this would validate JWT tokens etc.
    return "system@example.com"


# ---------- Account Routes ----------

@app.get("/api/accounts", response_model=ApiResponse, tags=["Accounts"])
def get_accounts(db: Session = Depends(get_db)):
    """Get all accounts"""
    accounts = AccountService.get_all_accounts(db)
    return ApiResponse(
        success=True,
        data=[{
            **account.__dict__,
            # Convert date objects to string format for JSON
            "revised_start_date": account.revised_start_date.isoformat() if account.revised_start_date else None,
            "planned_start_date": account.planned_start_date.isoformat() if account.planned_start_date else None,
            "planned_end_date": account.planned_end_date.isoformat() if account.planned_end_date else None,
            "updated_on": account.updated_on.isoformat(),
            "added_on": account.added_on.isoformat(),
            "_sa_instance_state": None  # Remove SQLAlchemy instance state
        } for account in accounts]
    )


@app.get("/api/accounts/{account_id}", response_model=ApiResponse, tags=["Accounts"])
def get_account(account_id: str = Path(..., description="ID of the account to retrieve"), 
               db: Session = Depends(get_db)):
    """Get a specific account by ID"""
    account = AccountService.get_account_by_id(db, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Convert date objects to string format for JSON
    account_dict = account.__dict__
    account_dict["revised_start_date"] = account.revised_start_date.isoformat() if account.revised_start_date else None
    account_dict["planned_start_date"] = account.planned_start_date.isoformat() if account.planned_start_date else None
    account_dict["planned_end_date"] = account.planned_end_date.isoformat() if account.planned_end_date else None
    account_dict["updated_on"] = account.updated_on.isoformat()
    account_dict["added_on"] = account.added_on.isoformat()
    account_dict["_sa_instance_state"] = None  # Remove SQLAlchemy instance state
    
    return ApiResponse(
        success=True,
        data=account_dict
    )


@app.post("/api/accounts", response_model=ApiResponse, tags=["Accounts"])
def create_account(account: AccountCreate, 
                  db: Session = Depends(get_db),
                  current_user: str = Depends(get_current_user)):
    """Create a new account"""
    try:
        new_account = AccountService.create_account(db, account, current_user)
        
        # Convert date objects to string format for JSON
        account_dict = new_account.__dict__
        account_dict["revised_start_date"] = new_account.revised_start_date.isoformat() if new_account.revised_start_date else None
        account_dict["planned_start_date"] = new_account.planned_start_date.isoformat() if new_account.planned_start_date else None
        account_dict["planned_end_date"] = new_account.planned_end_date.isoformat() if new_account.planned_end_date else None
        account_dict["updated_on"] = new_account.updated_on.isoformat()
        account_dict["added_on"] = new_account.added_on.isoformat()
        account_dict["_sa_instance_state"] = None  # Remove SQLAlchemy instance state
        
        return ApiResponse(
            success=True,
            message="Account added successfully",
            data=account_dict
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/accounts/{account_id}", response_model=ApiResponse, tags=["Accounts"])
def update_account(account_id: str, 
                  account: AccountUpdate,
                  db: Session = Depends(get_db),
                  current_user: str = Depends(get_current_user)):
    """Update an existing account"""
    updated_account = AccountService.update_account(db, account_id, account, current_user)
    if not updated_account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Convert date objects to string format for JSON
    account_dict = updated_account.__dict__
    account_dict["revised_start_date"] = updated_account.revised_start_date.isoformat() if updated_account.revised_start_date else None
    account_dict["planned_start_date"] = updated_account.planned_start_date.isoformat() if updated_account.planned_start_date else None
    account_dict["planned_end_date"] = updated_account.planned_end_date.isoformat() if updated_account.planned_end_date else None
    account_dict["updated_on"] = updated_account.updated_on.isoformat()
    account_dict["added_on"] = updated_account.added_on.isoformat()
    account_dict["_sa_instance_state"] = None  # Remove SQLAlchemy instance state
    
    return ApiResponse(
        success=True,
        message="Account updated successfully",
        data=account_dict
    )


@app.delete("/api/accounts/{account_id}", response_model=ApiResponse, tags=["Accounts"])
def delete_account(account_id: str, db: Session = Depends(get_db)):
    """Delete an account"""
    success = AccountService.delete_account(db, account_id)
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Account not found or cannot be deleted due to linked demands"
        )
    
    return ApiResponse(
        success=True,
        message="Account deleted successfully",
        data=True
    )


# ---------- Demand Routes ----------

@app.get("/api/demands", response_model=ApiResponse, tags=["Demands"])
def get_demands(db: Session = Depends(get_db)):
    """Get all demands"""
    demands = DemandService.get_all_demands(db)
    return ApiResponse(
        success=True,
        data=[{
            **demand.__dict__,
            # Convert date objects to string format for JSON
            "original_start_date": demand.original_start_date.isoformat() if demand.original_start_date else None,
            "allocation_end_date": demand.allocation_end_date.isoformat() if demand.allocation_end_date else None,
            "updated_on": demand.updated_on.isoformat(),
            "added_on": demand.added_on.isoformat(),
            "_sa_instance_state": None  # Remove SQLAlchemy instance state
        } for demand in demands]
    )


@app.get("/api/demands/{demand_id}", response_model=ApiResponse, tags=["Demands"])
def get_demand(demand_id: str = Path(..., description="ID of the demand to retrieve"), 
              db: Session = Depends(get_db)):
    """Get a specific demand by ID"""
    demand = DemandService.get_demand_by_id(db, demand_id)
    if not demand:
        raise HTTPException(status_code=404, detail="Demand not found")
    
    # Convert date objects to string format for JSON
    demand_dict = demand.__dict__
    demand_dict["original_start_date"] = demand.original_start_date.isoformat() if demand.original_start_date else None
    demand_dict["allocation_end_date"] = demand.allocation_end_date.isoformat() if demand.allocation_end_date else None
    demand_dict["updated_on"] = demand.updated_on.isoformat()
    demand_dict["added_on"] = demand.added_on.isoformat()
    demand_dict["_sa_instance_state"] = None  # Remove SQLAlchemy instance state
    
    return ApiResponse(
        success=True,
        data=demand_dict
    )


@app.get("/api/accounts/{account_id}/demands", response_model=ApiResponse, tags=["Demands"])
def get_demands_by_account(account_id: str, db: Session = Depends(get_db)):
    """Get all demands for a specific account"""
    # First verify account exists
    account = AccountService.get_account_by_id(db, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    demands = DemandService.get_demands_by_account(db, account_id)
    return ApiResponse(
        success=True,
        data=[{
            **demand.__dict__,
            # Convert date objects to string format for JSON
            "original_start_date": demand.original_start_date.isoformat() if demand.original_start_date else None,
            "allocation_end_date": demand.allocation_end_date.isoformat() if demand.allocation_end_date else None,
            "updated_on": demand.updated_on.isoformat(),
            "added_on": demand.added_on.isoformat(),
            "_sa_instance_state": None  # Remove SQLAlchemy instance state
        } for demand in demands]
    )


@app.post("/api/demands", response_model=ApiResponse, tags=["Demands"])
def create_demand(demand: DemandCreate, 
                 db: Session = Depends(get_db),
                 current_user: str = Depends(get_current_user)):
    """Create a new demand"""
    try:
        new_demand = DemandService.create_demand(db, demand, current_user)
        
        # Convert date objects to string format for JSON
        demand_dict = new_demand.__dict__
        demand_dict["original_start_date"] = new_demand.original_start_date.isoformat() if new_demand.original_start_date else None
        demand_dict["allocation_end_date"] = new_demand.allocation_end_date.isoformat() if new_demand.allocation_end_date else None
        demand_dict["updated_on"] = new_demand.updated_on.isoformat()
        demand_dict["added_on"] = new_demand.added_on.isoformat()
        demand_dict["_sa_instance_state"] = None  # Remove SQLAlchemy instance state
        
        return ApiResponse(
            success=True,
            message="Demand added successfully",
            data=demand_dict
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/demands/{demand_id}", response_model=ApiResponse, tags=["Demands"])
def update_demand(demand_id: str, 
                 demand: DemandUpdate,
                 db: Session = Depends(get_db),
                 current_user: str = Depends(get_current_user)):
    """Update an existing demand"""
    try:
        updated_demand = DemandService.update_demand(db, demand_id, demand, current_user)
        if not updated_demand:
            raise HTTPException(status_code=404, detail="Demand not found")
        
        # Convert date objects to string format for JSON
        demand_dict = updated_demand.__dict__
        demand_dict["original_start_date"] = updated_demand.original_start_date.isoformat() if updated_demand.original_start_date else None
        demand_dict["allocation_end_date"] = updated_demand.allocation_end_date.isoformat() if updated_demand.allocation_end_date else None
        demand_dict["updated_on"] = updated_demand.updated_on.isoformat()
        demand_dict["added_on"] = updated_demand.added_on.isoformat()
        demand_dict["_sa_instance_state"] = None  # Remove SQLAlchemy instance state
        
        return ApiResponse(
            success=True,
            message="Demand updated successfully",
            data=demand_dict
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/demands/{demand_id}", response_model=ApiResponse, tags=["Demands"])
def delete_demand(demand_id: str, db: Session = Depends(get_db)):
    """Delete a demand"""
    success = DemandService.delete_demand(db, demand_id)
    if not success:
        raise HTTPException(status_code=404, detail="Demand not found")
    
    return ApiResponse(
        success=True,
        message="Demand deleted successfully",
        data=True
    )


@app.post("/api/demands/{demand_id}/clone", response_model=ApiResponse, tags=["Demands"])
def clone_demand(
    demand_id: str, 
    count: int = Query(1, description="Number of clones to create", ge=1, le=10),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Clone a demand multiple times"""
    try:
        clones = DemandService.clone_demand(db, demand_id, count, current_user)
        
        # Convert date objects to string format for JSON
        clones_dict = [{
            **clone.__dict__,
            "original_start_date": clone.original_start_date.isoformat() if clone.original_start_date else None,
            "allocation_end_date": clone.allocation_end_date.isoformat() if clone.allocation_end_date else None,
            "updated_on": clone.updated_on.isoformat(),
            "added_on": clone.added_on.isoformat(),
            "_sa_instance_state": None  # Remove SQLAlchemy instance state
        } for clone in clones]
        
        return ApiResponse(
            success=True,
            message=f"{count} demand(s) cloned successfully",
            data=clones_dict
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------- Dashboard Routes ----------

@app.get("/api/dashboard/stats", response_model=ApiResponse, tags=["Dashboard"])
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    stats = DashboardService.get_dashboard_stats(db)
    return ApiResponse(
        success=True,
        data=stats.dict()
    )


# ---------- Search Routes ----------

@app.get("/api/search", response_model=ApiResponse, tags=["Search"])
def search(
    query: str = Query(..., description="Search query string"),
    entity: str = Query(..., description="Entity type to search", regex="^(accounts|demands)$"),
    db: Session = Depends(get_db)
):
    """Search accounts or demands"""
    try:
        results = DashboardService.search(db, query, entity)
        
        # Convert results to dict and handle date objects
        if entity == "accounts":
            data = [{
                **account.__dict__,
                "revised_start_date": account.revised_start_date.isoformat() if account.revised_start_date else None,
                "planned_start_date": account.planned_start_date.isoformat() if account.planned_start_date else None,
                "planned_end_date": account.planned_end_date.isoformat() if account.planned_end_date else None,
                "updated_on": account.updated_on.isoformat(),
                "added_on": account.added_on.isoformat(),
                "_sa_instance_state": None  # Remove SQLAlchemy instance state
            } for account in results]
        else:  # demands
            data = [{
                **demand.__dict__,
                "original_start_date": demand.original_start_date.isoformat() if demand.original_start_date else None,
                "allocation_end_date": demand.allocation_end_date.isoformat() if demand.allocation_end_date else None,
                "updated_on": demand.updated_on.isoformat(),
                "added_on": demand.added_on.isoformat(),
                "_sa_instance_state": None  # Remove SQLAlchemy instance state
            } for demand in results]
        
        return ApiResponse(
            success=True,
            data=data
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------- Health Check Routes ----------

@app.get("/api/health", tags=["Health"])
def health_check():
    """Simple health check endpoint"""
    return {"status": "ok", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

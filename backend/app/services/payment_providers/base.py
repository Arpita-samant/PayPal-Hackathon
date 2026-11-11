from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple
from app.models.schemas import PayoutResponse, PayoutItemReceipt

class BasePaymentProvider(ABC):
    provider_id: str
    name: str
    supported_currencies: List[str]
    supported_countries: List[str]
    account_type_label: str
    placeholder: str
    supports_batching: bool
    description: str

    @abstractmethod
    def calculate_fee(self, total_amount: float, currency: str) -> float:
        """Calculate transaction/processing fees for the disbursement"""
        pass

    @abstractmethod
    def validate_recipient_account(
        self, 
        account_type: str, 
        account_value: str, 
        country: str, 
        currency: str
    ) -> Tuple[bool, str]:
        """Validates recipient account format and country/currency eligibility"""
        pass

    @abstractmethod
    async def execute_payout(
        self,
        team_id: str,
        items: List[Dict[str, Any]],
        currency: str,
        note: str,
        simulate: bool
    ) -> PayoutResponse:
        """Executes payment disbursement (batched or parallel) and tracks item statuses"""
        pass

import re
import uuid
from typing import List, Dict, Any, Tuple
from datetime import datetime, timezone
from app.models.schemas import PayoutResponse, PayoutItemReceipt
from app.services.payment_providers.base import BasePaymentProvider

class StripeBankTransferProvider(BasePaymentProvider):
    provider_id = "stripe_transfer"
    name = "Stripe Direct Bank Transfer (ACH / SEPA / BACS)"
    supported_currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "SGD", "CHF", "AED"]
    supported_countries = ["US", "GB", "EU", "CA", "AU", "SG", "GLOBAL"]
    account_type_label = "IBAN / Routing Account"
    placeholder = "US0000123456789 or GB82WEST123456"
    supports_batching = True
    description = "Direct domestic & cross-border bank account settlement with low wire fees."

    def calculate_fee(self, total_amount: float, currency: str) -> float:
        # Standard ACH/SEPA payout fee: 0.25% + $0.25
        return round(0.25 + total_amount * 0.0025, 2)

    def validate_recipient_account(
        self, 
        account_type: str, 
        account_value: str, 
        country: str, 
        currency: str
    ) -> Tuple[bool, str]:
        val = account_value.strip().replace(" ", "").upper()
        if len(val) < 8 or len(val) > 34:
            return False, "Invalid bank account or IBAN length (must be between 8 and 34 alphanumeric characters)."
        return True, "Valid Bank Account / IBAN format."

    async def execute_payout(
        self,
        team_id: str,
        items: List[Dict[str, Any]],
        currency: str,
        note: str,
        simulate: bool
    ) -> PayoutResponse:
        total_amount = sum(item["amount"] for item in items)
        fee_amount = self.calculate_fee(total_amount, currency)
        final_total = round(total_amount + fee_amount, 2)
        batch_id = f"STRIPE-PO-{team_id[:8]}-{uuid.uuid4().hex[:6]}"

        receipt_items = []
        for idx, item in enumerate(items):
            receipt_items.append(PayoutItemReceipt(
                member_id=item["member_id"],
                recipient_name=item["recipient_name"],
                recipient_username=item["recipient_username"],
                account_type="iban",
                receiving_account=item["account_value"][:4] + "****" + item["account_value"][-4:],
                amount=item["amount"],
                currency=currency,
                transaction_id=f"tr_{uuid.uuid4().hex[:20]}",
                status="SUCCESS"
            ))

        return PayoutResponse(
            success=True,
            batch_id=batch_id,
            provider=self.provider_id,
            status="SUCCESS",
            total_amount=total_amount,
            fee_amount=fee_amount,
            final_total=final_total,
            currency=currency,
            timestamp=datetime.now(timezone.utc),
            items=receipt_items,
            raw_provider_response={"provider": "stripe_transfer", "method": "ach_sepa"}
        )

class WiseProvider(BasePaymentProvider):
    provider_id = "wise"
    name = "Wise (Formerly TransferWise) Borderless"
    supported_currencies = ["USD", "INR", "EUR", "GBP", "CAD", "AUD", "SGD", "JPY", "AED", "CHF"]
    supported_countries = ["GLOBAL"]
    account_type_label = "Wise Account Email"
    placeholder = "recipient.wise@example.com"
    supports_batching = True
    description = "True mid-market FX rates to 70+ countries with instant multi-currency wallet delivery."

    def calculate_fee(self, total_amount: float, currency: str) -> float:
        # Transparent mid-market ~0.35%
        return round(total_amount * 0.0035, 2)

    def validate_recipient_account(
        self, 
        account_type: str, 
        account_value: str, 
        country: str, 
        currency: str
    ) -> Tuple[bool, str]:
        email_pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
        if not re.match(email_pattern, account_value.strip()):
            return False, "Invalid Wise recipient email."
        return True, "Valid Wise account email."

    async def execute_payout(
        self,
        team_id: str,
        items: List[Dict[str, Any]],
        currency: str,
        note: str,
        simulate: bool
    ) -> PayoutResponse:
        total_amount = sum(item["amount"] for item in items)
        fee_amount = self.calculate_fee(total_amount, currency)
        final_total = round(total_amount + fee_amount, 2)
        batch_id = f"WISE-BATCH-{team_id[:8]}-{uuid.uuid4().hex[:6]}"

        receipt_items = []
        for idx, item in enumerate(items):
            receipt_items.append(PayoutItemReceipt(
                member_id=item["member_id"],
                recipient_name=item["recipient_name"],
                recipient_username=item["recipient_username"],
                account_type="wise_email",
                receiving_account=item["account_value"],
                amount=item["amount"],
                currency=currency,
                transaction_id=f"WISE-TX-{uuid.uuid4().hex[:12].upper()}",
                status="SUCCESS"
            ))

        return PayoutResponse(
            success=True,
            batch_id=batch_id,
            provider=self.provider_id,
            status="SUCCESS",
            total_amount=total_amount,
            fee_amount=fee_amount,
            final_total=final_total,
            currency=currency,
            timestamp=datetime.now(timezone.utc),
            items=receipt_items,
            raw_provider_response={"provider": "wise", "rate_type": "mid_market"}
        )

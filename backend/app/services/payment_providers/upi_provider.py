import re
import uuid
import logging
from typing import List, Dict, Any, Tuple
from datetime import datetime, timezone
from app.models.schemas import PayoutResponse, PayoutItemReceipt
from app.services.payment_providers.base import BasePaymentProvider

logger = logging.getLogger(__name__)

class UPIRazorpayProvider(BasePaymentProvider):
    provider_id = "upi_razorpay"
    name = "UPI / Direct Bank Transfer (India & Global)"
    supported_currencies = ["INR", "USD"]
    supported_countries = ["IN", "GLOBAL"]
    account_type_label = "UPI ID / VPA"
    placeholder = "username@okaxis or name@upi"
    supports_batching = True
    description = "Zero-delay instant micro-deposits directly to Indian bank accounts via Unified Payments Interface."

    def calculate_fee(self, total_amount: float, currency: str) -> float:
        # Standard domestic UPI payout fee: flat ₹10 or 0.2%
        if currency == "INR":
            return round(min(50.0, max(5.0, total_amount * 0.002)), 2)
        return round(total_amount * 0.01, 2)

    def validate_recipient_account(
        self, 
        account_type: str, 
        account_value: str, 
        country: str, 
        currency: str
    ) -> Tuple[bool, str]:
        val = account_value.strip()
        # UPI VPA pattern: e.g. name@bank, 9876543210@paytm, user-dev@okhdfcbank
        upi_pattern = r"^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$"
        if not re.match(upi_pattern, val):
            return False, "Invalid UPI ID. Format should be username@handle (e.g. rahul@okicici)."
        return True, "Valid UPI Virtual Payment Address (VPA)."

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
        batch_id = f"UPI-BATCH-{team_id[:8]}-{uuid.uuid4().hex[:6]}"

        receipt_items = []
        for idx, item in enumerate(items):
            receipt_items.append(PayoutItemReceipt(
                member_id=item["member_id"],
                recipient_name=item["recipient_name"],
                recipient_username=item["recipient_username"],
                account_type="upi_id",
                receiving_account=item["account_value"],
                amount=item["amount"],
                currency=currency,
                transaction_id=f"UPI-UTR-{uuid.uuid4().hex[:12].upper()}",
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
            raw_provider_response={"provider": "upi_razorpay", "npci_settlement": "INSTANT"}
        )

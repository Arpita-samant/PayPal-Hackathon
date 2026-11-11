from typing import List, Optional
from app.services.payment_providers.base import BasePaymentProvider
from app.services.payment_providers.paypal_provider import PayPalPayoutProvider
from app.services.payment_providers.upi_provider import UPIRazorpayProvider
from app.services.payment_providers.stripe_provider import StripeBankTransferProvider, WiseProvider
from app.models.schemas import PaymentProviderInfo

class PaymentProviderRegistry:
    _providers = {
        "paypal": PayPalPayoutProvider(),
        "upi_razorpay": UPIRazorpayProvider(),
        "stripe_transfer": StripeBankTransferProvider(),
        "wise": WiseProvider(),
    }

    @classmethod
    def get(cls, provider_id: str) -> Optional[BasePaymentProvider]:
        return cls._providers.get(provider_id.lower())

    @classmethod
    def get_or_default(cls, provider_id: str) -> BasePaymentProvider:
        return cls._providers.get(provider_id.lower(), cls._providers["paypal"])

    @classmethod
    def list_providers(cls) -> List[PaymentProviderInfo]:
        return [
            PaymentProviderInfo(
                provider_id=p.provider_id,
                name=p.name,
                supported_currencies=p.supported_currencies,
                supported_countries=p.supported_countries,
                account_type_label=p.account_type_label,
                placeholder=p.placeholder,
                supports_batching=p.supports_batching,
                description=p.description
            )
            for p in cls._providers.values()
        ]

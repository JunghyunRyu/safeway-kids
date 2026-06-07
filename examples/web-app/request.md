# Example request — Web App

Add checkout validation for coupon and payment compatibility.

## Requirements
- When a coupon requires card payment, block unsupported payment methods.
- Keep the checkout form state intact when validation fails.
- Show a clear error message near the payment section.
- Add or update tests covering:
  - no coupon
  - compatible coupon/payment
  - incompatible coupon/payment
  - error-state preservation
- Use the repository workflow in `CLAUDE.md`.

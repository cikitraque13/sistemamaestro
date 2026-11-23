PLANS = {
    "free": {
        "name": "Gratis",
        "price": 0.0,
        "features": ["diagnosis", "route"]
    },
    "blueprint": {
        "name": "Blueprint",
        "price": 29.0,
        "features": ["diagnosis", "route", "blueprint", "priorities"]
    },
    "sistema": {
        "name": "Sistema",
        "price": 79.0,
        "features": ["diagnosis", "route", "blueprint", "priorities", "continuity", "deployment"]
    },
    "premium": {
        "name": "Premium",
        "price": 199.0,
        "features": ["diagnosis", "route", "blueprint", "priorities", "continuity", "deployment", "support", "opportunities"]
    }
}

# Sin ofertas puntuales activas: el informe puntual (single_report) se retiró el 2026-11-23.
# Las transacciones históricas siguen en payment_transactions; el checkout rechaza la oferta.
ONE_TIME_OFFERS = {}

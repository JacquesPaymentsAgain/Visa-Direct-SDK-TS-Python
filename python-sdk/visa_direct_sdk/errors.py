class JWEKidUnknownError(Exception):
	pass


class JWEDecryptError(Exception):
	pass


class QuoteRequiredError(Exception):
	pass


class QuoteExpiredError(Exception):
	pass


class DestinationNotAllowedError(Exception):
	pass


REVOKE ALL ON FUNCTION public.validate_invite() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_invite() FROM anon, authenticated;
-- Trigger execution does not require the caller to have EXECUTE.

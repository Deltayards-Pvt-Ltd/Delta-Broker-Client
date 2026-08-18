import { useCallback, useState } from "react";
import { resolveOfferFromFeed } from "@/lib/offerApi";

export function useOfferPreview() {
  const [open, setOpen] = useState(false);
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openOffer = useCallback((doc) => {
    setError("");
    setLoading(false);
    setOffer(doc || null);
    setOpen(true);
  }, []);

  const openFromFeed = useCallback(async (item) => {
    setOpen(true);
    setOffer(null);
    setError("");
    setLoading(true);
    try {
      const doc = await resolveOfferFromFeed(item);
      setOffer(doc);
      if (!doc) setError("Offer not found.");
    } catch (err) {
      setError(err.message || "Failed to load offer");
    } finally {
      setLoading(false);
    }
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setOffer(null);
    setLoading(false);
    setError("");
  }, []);

  return { open, offer, loading, error, openOffer, openFromFeed, close };
}

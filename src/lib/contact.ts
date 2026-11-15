export function getContact() {
  const phone = process.env.CONTACT_PHONE?.trim() || "";
  const whatsapp = (process.env.CONTACT_WHATSAPP || "").replace(/[^\d]/g, "");
  const email = process.env.CONTACT_EMAIL?.trim() || "hello@skilvantage.com";
  const location = process.env.CONTACT_LOCATION?.trim() || "India";
  const locationDetail =
    process.env.CONTACT_LOCATION_DETAIL?.trim() ||
    "Online, hybrid, and classroom batches. City and venue details are shared when a cohort is announced.";
  return { phone, whatsapp, email, location, locationDetail };
}

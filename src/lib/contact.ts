export function getContact() {
  const phone = process.env.CONTACT_PHONE?.trim() || "+91 63032 20248";
  const whatsapp = (process.env.CONTACT_WHATSAPP?.trim() || "916303220248").replace(/[^\d]/g, "");
  const email = process.env.CONTACT_EMAIL?.trim() || "skillvantageadmin@gmail.com";
  const location = process.env.CONTACT_LOCATION?.trim() || "Hyderabad, India";
  const locationDetail =
    process.env.CONTACT_LOCATION_DETAIL?.trim() ||
    "SkilVantage, Hyderabad, India. Online, hybrid, and classroom batches.";
  return { phone, whatsapp, email, location, locationDetail };
}

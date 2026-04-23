exports.getCustomsAdvice = ({ itemType, destinationCountry }) => {
  let advice = "No special customs requirements detected.";

  if (!destinationCountry || destinationCountry.toLowerCase() === "india") {
    return "Domestic shipment. No customs clearance required.";
  }

  if (itemType?.toLowerCase().includes("electronics")) {
    advice =
      "Electronics may require invoice, GST details, and customs declaration.";
  } else if (itemType?.toLowerCase().includes("food")) {
    advice =
      "Food items may require FSSAI approval and import permits.";
  } else if (itemType?.toLowerCase().includes("medicine")) {
    advice =
      "Medicines require prescription and drug authority approval.";
  }

  return advice;
};

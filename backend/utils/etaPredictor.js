exports.predictETA = ({ distanceKm, vehicleType, status }) => {

  if (status === "Pending") {
    return "Driver not yet started";
  }

  const speedMap = {
    Bike: 35,
    "Small Truck": 40,
    "Large Truck": 50
  };

  const speed = speedMap[vehicleType] || 35;

  const timeHours = distanceKm / speed;

  const etaMinutes = Math.ceil(timeHours * 60);

  const etaDate = new Date();
  etaDate.setMinutes(etaDate.getMinutes() + etaMinutes);

  return etaDate.toLocaleString("en-IN");
};
// utils/vehicleUtils.js

const getRequiredVehicleType = (items) => {

    const totalWeight = items.reduce((sum, item) => {
        const weight = parseFloat(item.weight);
        return sum + (isNaN(weight) ? 0 : weight);
    }, 0);

    console.log("⚖️ Total Weight:", totalWeight);

    if (totalWeight <= 5) {
        return "Bike";
    } 
    if (totalWeight <= 10) {
        return "Small Truck";
    } 
    return "Large Truck";
};


module.exports = { getRequiredVehicleType };
exports.selectBestDriver = (drivers, pickupLocation) => {

  if (!drivers || drivers.length === 0) return null;

  return drivers.sort((a, b) => {

    const ratingA = a.rating || 5;
    const ratingB = b.rating || 5;

    const experienceA = a.experience || 0;
    const experienceB = b.experience || 0;

    const scoreA = ratingA * 2 + experienceA;
    const scoreB = ratingB * 2 + experienceB;

    return scoreB - scoreA;

  })[0];
};
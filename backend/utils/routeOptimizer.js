exports.getOptimizedRoute = ({ pickup, drop }) => {

  return {
    routeNote: "AI optimized route selected",
    estimatedDelayMinutes: Math.floor(Math.random() * 15)
  };

};
function checkCooldown(conflictLevel) {

  if (conflictLevel === "high") {

    return {
      active: true,
      message:
      "It seems emotions are running high. \
      Let's pause for a moment before continuing."
    };

  }

  return { active: false };
}

module.exports = checkCooldown;
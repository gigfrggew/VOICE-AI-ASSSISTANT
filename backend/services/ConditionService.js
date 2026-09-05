function EvaluateConditions(conditions, capturedData) {
  if (!conditions || conditions.length === 0) {
    return [];
  }

  const matchedConditions = [];

  for (const condition of conditions) {
    const fieldValue = capturedData[condition.field];

    if (fieldValue === undefined || fieldValue === null) {
      continue;
    }

    let matched = false;

    switch (condition.operator) {
      case "equals":
        matched =
          String(fieldValue).toLowerCase() ===
          String(condition.value).toLowerCase();
        break;

      case "not_equals":
        matched =
          String(fieldValue).toLowerCase() !==
          String(condition.value).toLowerCase();
        break;

      case "contains":
        matched = String(fieldValue)
          .toLowerCase()
          .includes(String(condition.value).toLowerCase());
        break;

      case "greater_than":
        matched =
          Number(fieldValue) > Number(condition.value);
        break;

      case "less_than":
        matched =
          Number(fieldValue) < Number(condition.value);
        break;

      default:
        matched = false;
    }

    if (matched) {
      matchedConditions.push({
        field: condition.field,
        operator: condition.operator,
        value: condition.value,
        action: condition.action,
      });
    }
  }

  return matchedConditions;
}

export default EvaluateConditions;
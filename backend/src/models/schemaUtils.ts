export const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

export function requiredString(maxlength = 160): any {
  return {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength
  };
}

export function optionalString(maxlength = 240): any {
  return {
    type: String,
    trim: true,
    maxlength
  };
}

export function optionalUrl(): any {
  return {
    type: String,
    trim: true,
    validate: {
      validator: (value?: string) => !value || URL_REGEX.test(value),
      message: "Must be a valid http or https URL"
    }
  };
}

export function stringList(maxItems = 30, maxLength = 80): any {
  return {
    type: [
      {
        type: String,
        trim: true,
        lowercase: true,
        minlength: 1,
        maxlength: maxLength
      }
    ],
    default: [],
    validate: {
      validator: (items: string[]) => items.length <= maxItems,
      message: `Cannot contain more than ${maxItems} items`
    }
  };
}

export function uniqueLowercase(values: string[] = []) {
  return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))];
}

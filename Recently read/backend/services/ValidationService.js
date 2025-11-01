/**
 * Validation Service
 */
 class ValidationService {
    constructor() {
        this.rules = {
            sourceType: {
                required: true,
                allowedValues: ['Book', 'Article', 'Substack', 'Research Paper', 'Blog Post', 'Podcast', 'Video', 'Other']
            },
            sourceName: {
                required: true,
                minLength: 2,
                maxLength: 200
            },
            author: {
                required: false,
                maxLength: 100
            },
            reflection: {
                required: true,
                minLength: 10,
                maxLength: 5000
            }
        };
    }

    validateEntry(entryData) {
        const errors = [];

        Object.keys(this.rules).forEach(field => {
            const rule = this.rules[field];
            const value = entryData[field];

            const fieldErrors = this.validateField(field, value, rule);
            errors.push(...fieldErrors);
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validateField(fieldName, value, rule) {
        const errors = [];
        const trimmedValue = typeof value === 'string' ? value.trim() : value;

        // Required check
        if (rule.required && (!trimmedValue || trimmedValue === '')) {
            errors.push(`${this.getFieldLabel(fieldName)} is required`);
            return errors; // Skip other validations if required field is empty
        }

        // Skip other validations if field is optional and empty
        if (!rule.required && (!trimmedValue || trimmedValue === '')) {
            return errors;
        }

        // Length validations
        if (rule.minLength && trimmedValue.length < rule.minLength) {
            errors.push(`${this.getFieldLabel(fieldName)} must be at least ${rule.minLength} characters`);
        }

        if (rule.maxLength && trimmedValue.length > rule.maxLength) {
            errors.push(`${this.getFieldLabel(fieldName)} must be less than ${rule.maxLength} characters`);
        }

        // Allowed values check
        if (rule.allowedValues && !rule.allowedValues.includes(trimmedValue)) {
            errors.push(`${this.getFieldLabel(fieldName)} must be one of: ${rule.allowedValues.join(', ')}`);
        }

        // Custom validations
        if (fieldName === 'sourceName') {
            if (!/^[a-zA-Z0-9\s\-\.\,\:\;\!\?\(\)]+$/.test(trimmedValue)) {
                errors.push('Source name contains invalid characters');
            }
        }

        if (fieldName === 'author') {
            if (trimmedValue && !/^[a-zA-Z\s\-\.]+$/.test(trimmedValue)) {
                errors.push('Author name should only contain letters, spaces, hyphens, and periods');
            }
        }

        return errors;
    }

    getFieldLabel(fieldName) {
        const labels = {
            sourceType: 'Source type',
            sourceName: 'Source name',
            author: 'Author',
            reflection: 'Reflection'
        };

        return labels[fieldName] || fieldName;
    }

    sanitizeInput(value) {
        if (typeof value !== 'string') return value;
        
        return value
            .trim()
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/[<>]/g, ''); // Remove potential HTML tags
    }
}
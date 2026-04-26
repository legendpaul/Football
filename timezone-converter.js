/**
 * Timezone Converter Utility
 * Handles proper timezone conversions for football matches
 */

class TimezoneConverter {
    constructor() {
        // June 2025 - Summer time is active
        this.isSummerTime = true;
        
        // Timezone offsets during summer (DST active)
        this.timezones = {
            // European timezones
            'UTC': 0,
            'GMT': 0,    // Greenwich Mean Time (UK winter)
            'BST': 1,    // British Summer Time (UK summer) - currently active
            'CET': 1,    // Central European Time (winter)
            'CEST': 2,   // Central European Summer Time - currently active
            
            // US timezones (summer)
            'EDT': -4,   // Eastern Daylight Time
            'CDT': -5,   // Central Daylight Time  
            'MDT': -6,   // Mountain Daylight Time
            'PDT': -7,   // Pacific Daylight Time
            
            // US timezones (winter)
            'EST': -5,   // Eastern Standard Time
            'CST': -6,   // Central Standard Time
            'MST': -7,   // Mountain Standard Time
            'PST': -8    // Pacific Standard Time
        };
    }

    // Convert CET/CEST time to UK time (GMT/BST)
    convertCETToUK(timeString, includeCEST = true) {
        try {
            const [hours, minutes] = timeString.split(':').map(Number);
            
            // In June 2025:
            // - Slovakia (UEFA U21 host) uses CEST (UTC+2)
            // - UK uses BST (UTC+1)
            // So Slovakia is 1 hour ahead of UK
            
            let ukHours;
            if (includeCEST && this.isSummerTime) {
                // CEST (UTC+2) to BST (UTC+1): subtract 1 hour
                ukHours = hours - 1;
            } else {
                // CET (UTC+1) to GMT (UTC+0): subtract 1 hour
                ukHours = hours - 1;
            }
            
            // Handle day rollover
            if (ukHours < 0) {
                ukHours = 24 + ukHours;
            }
            
            return `${ukHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        } catch (error) {
            console.warn('CET to UK conversion failed:', error);
            return timeString; // Return original if conversion fails
        }
    }

    // Convert US timezone to UK time
    convertUSToUK(timeString, usTimezone = 'EDT') {
        try {
            const [hours, minutes] = timeString.split(':').map(Number);
            
            // Get timezone offsets
            const usOffset = this.timezones[usTimezone] || -4; // Default to EDT
            const ukOffset = this.timezones['BST']; // UK uses BST in summer
            
            // Calculate time difference
            const timeDifference = ukOffset - usOffset;
            let ukHours = hours + timeDifference;
            
            // Handle day rollover
            if (ukHours >= 24) {
                ukHours = ukHours - 24;
            } else if (ukHours < 0) {
                ukHours = 24 + ukHours;
            }
            
            return `${ukHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        } catch (error) {
            console.warn('US to UK conversion failed:', error);
            return timeString;
        }
    }

    // Convert UTC to UK time
    convertUTCToUK(timeString) {
        try {
            const [hours, minutes] = timeString.split(':').map(Number);
            
            // In summer, UK uses BST (UTC+1)
            let ukHours;
            if (this.isSummerTime) {
                ukHours = hours + 1; // UTC to BST
            } else {
                ukHours = hours; // UTC to GMT
            }
            
            // Handle day rollover
            if (ukHours >= 24) {
                ukHours = ukHours - 24;
            }
            
            return `${ukHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        } catch (error) {
            console.warn('UTC to UK conversion failed:', error);
            return timeString;
        }
    }

    // Convert any timezone to UK time
    convertToUK(timeString, fromTimezone) {
        try {
            const [hours, minutes] = timeString.split(':').map(Number);
            
            const fromOffset = this.timezones[fromTimezone] || 0;
            const ukOffset = this.isSummerTime ? this.timezones['BST'] : this.timezones['GMT'];
            
            const timeDifference = ukOffset - fromOffset;
            let ukHours = hours + timeDifference;
            
            // Handle day rollover
            while (ukHours >= 24) {
                ukHours = ukHours - 24;
            }
            while (ukHours < 0) {
                ukHours = 24 + ukHours;
            }
            
            return `${ukHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        } catch (error) {
            console.warn('Generic timezone conversion failed:', error);
            return timeString;
        }
    }

    // Get current UK time
    getCurrentUKTime() {
        const now = new Date();
        
        // Create a date in UK timezone
        const ukTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/London"}));
        
        return ukTime.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    // Format time with timezone indicator
    formatTimeWithTimezone(timeString, timezone = 'BST') {
        return `${timeString} ${timezone}`;
    }

    // Get timezone info for a location
    getTimezoneInfo(location) {
        const timezoneMap = {
            'slovakia': { timezone: 'CEST', offset: '+2', name: 'Central European Summer Time' },
            'uk': { timezone: 'BST', offset: '+1', name: 'British Summer Time' },
            'usa-east': { timezone: 'EDT', offset: '-4', name: 'Eastern Daylight Time' },
            'usa-central': { timezone: 'CDT', offset: '-5', name: 'Central Daylight Time' },
            'usa-mountain': { timezone: 'MDT', offset: '-6', name: 'Mountain Daylight Time' },
            'usa-pacific': { timezone: 'PDT', offset: '-7', name: 'Pacific Daylight Time' }
        };
        
        return timezoneMap[location.toLowerCase()] || { timezone: 'UTC', offset: '+0', name: 'Coordinated Universal Time' };
    }

    // Validate if timezone conversion looks correct
    validateConversion(originalTime, convertedTime, fromTz, toTz) {
        const [origHours] = originalTime.split(':').map(Number);
        const [convHours] = convertedTime.split(':').map(Number);
        
        const fromOffset = this.timezones[fromTz] || 0;
        const toOffset = this.timezones[toTz] || 0;
        const expectedDiff = toOffset - fromOffset;
        
        let actualDiff = convHours - origHours;
        
        // Handle day rollover in comparison
        if (actualDiff > 12) actualDiff -= 24;
        if (actualDiff < -12) actualDiff += 24;
        
        return Math.abs(actualDiff - expectedDiff) <= 1; // Allow 1 hour tolerance
    }
}

// Create global instance
window.timezoneConverter = new TimezoneConverter();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimezoneConverter;
}

console.log('🕐 Timezone Converter loaded - Summer time (DST) active for June 2025');
console.log('📍 UK: BST (UTC+1), Slovakia: CEST (UTC+2), US East: EDT (UTC-4)');

document.getElementById('calculate-button').addEventListener('click', calculateTotalHours);
document.getElementById('calendar-button').addEventListener('click', generateICal);

function calculateTotalHours() {
    const data = document.getElementById('shift-data').value;
    const lines = data.split('\n');
    let totalWorkMinutes = 0;
    let totalSalary = 0;
    let currentDate = null;
    let shiftsInMonth = {};
    const hourlyWage = parseFloat(document.getElementById('hourly-wage').value);
    const oneWayCommuteCost = parseFloat(document.getElementById('commute-cost').value);

    if (isNaN(hourlyWage) || isNaN(oneWayCommuteCost)) {
        alert("時給と通勤代を正しく入力してください。");
        return;
    }

    lines.forEach((line, index) => {
        line = line.trim();

        const dateMatch = line.match(/^(\d{1,2})\/(\d{1,2})(?:\((\w+)\))?/);
        if (dateMatch) {
            const month = dateMatch[1].padStart(2, '0');
            const day = dateMatch[2].padStart(2, '0');
            let year = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1;
            if (currentMonth === 12 && parseInt(month) < 3) {
                year += 1;
            }
            currentDate = { year, month, day };
            return;
        }

        const workMatch = line.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
        if (workMatch && currentDate) {
            const startHours = parseInt(workMatch[1], 10);
            const startMinutes = parseInt(workMatch[2], 10);
            const endHours = parseInt(workMatch[3], 10);
            const endMinutes = parseInt(workMatch[4], 10);

            let shiftStart = new Date(currentDate.year, currentDate.month - 1, currentDate.day, startHours, startMinutes);
            let shiftEnd = new Date(currentDate.year, currentDate.month - 1, currentDate.day, endHours, endMinutes);
            if (shiftEnd < shiftStart) {
                shiftEnd.setDate(shiftEnd.getDate() + 1);
            }

            let workMinutes = (shiftEnd - shiftStart) / (1000 * 60);

            const nextLine = lines[index + 1]?.trim();
            if (nextLine && nextLine.match(/^\[休/)) {
                const breakMatch = nextLine.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
                if (breakMatch) {
                    const breakStartHours = parseInt(breakMatch[1], 10);
                    const breakStartMinutes = parseInt(breakMatch[2], 10);
                    const breakEndHours = parseInt(breakMatch[3], 10);
                    const breakEndMinutes = parseInt(breakMatch[4], 10);

                    let breakStart = new Date(currentDate.year, currentDate.month - 1, currentDate.day, breakStartHours, breakStartMinutes);
                    let breakEnd = new Date(currentDate.year, currentDate.month - 1, currentDate.day, breakEndHours, breakEndMinutes);
                    if (breakEnd < breakStart) {
                        breakEnd.setDate(breakEnd.getDate() + 1);
                    }

                    const breakMinutes = (breakEnd - breakStart) / (1000 * 60);
                    workMinutes -= breakMinutes;
                }
            }

            totalWorkMinutes += workMinutes;

            let salary = 0;
            let tempTime = new Date(shiftStart);

            while (tempTime < shiftEnd) {
                let nextTempTime = new Date(tempTime);
                nextTempTime.setMinutes(tempTime.getMinutes() + 1);

                let hour = tempTime.getHours() + tempTime.getMinutes() / 60;

                let wageMultiplier = 1;
                if (hour < 5 || hour >= 22) {
                    wageMultiplier = 1.25;
                }

                salary += (hourlyWage / 60) * wageMultiplier;

                tempTime = nextTempTime;
            }

            salary += 500;

            const commuteCost = oneWayCommuteCost * 2;
            salary += commuteCost;

            const monthKey = `${currentDate.year}-${currentDate.month}`;
            if (!shiftsInMonth[monthKey]) {
                shiftsInMonth[monthKey] = { commuteTotal: 0 };
            }
            shiftsInMonth[monthKey].commuteTotal += commuteCost;

            totalSalary += salary;
        }
    });

    for (let key in shiftsInMonth) {
        if (shiftsInMonth[key].commuteTotal > 30000) {
            const overAmount = shiftsInMonth[key].commuteTotal - 30000;
            totalSalary -= overAmount;
        }
    }

    const totalWorkHours = (totalWorkMinutes / 60).toFixed(2);
    document.getElementById('total-work-hours').innerText = totalWorkHours;

    document.getElementById('estimated-salary').innerText = Math.floor(totalSalary).toLocaleString();
}

function generateICal() {
    const data = document.getElementById('shift-data').value;
    const lines = data.split('\n');
    let events = [];
    let currentDate = null;

    lines.forEach((line, index) => {
        line = line.trim();

        const dateMatch = line.match(/^(\d{1,2})\/(\d{1,2})(?:\((\w+)\))?/);
        if (dateMatch) {
            const month = dateMatch[1].padStart(2, '0');
            const day = dateMatch[2].padStart(2, '0');
            let year = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1;
            if (currentMonth === 12 && parseInt(month) < 3) {
                year += 1;
            }
            currentDate = { year, month, day };
            return;
        }

        const workMatch = line.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
        if (workMatch && currentDate) {
            const startHour = workMatch[1].padStart(2, '0');
            const startMinute = workMatch[2].padStart(2, '0');
            const endHour = workMatch[3].padStart(2, '0');
            const endMinute = workMatch[4].padStart(2, '0');

            let startDateTime = `${currentDate.year}${currentDate.month}${currentDate.day}T${startHour}${startMinute}00`;
            let endDateTime = `${currentDate.year}${currentDate.month}${currentDate.day}T${endHour}${endMinute}00`;

            if (parseInt(endHour) < parseInt(startHour)) {
                const endDate = new Date(currentDate.year, currentDate.month - 1, currentDate.day);
                endDate.setDate(endDate.getDate() + 1);
                const endYear = endDate.getFullYear();
                const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
                const endDay = String(endDate.getDate()).padStart(2, '0');
                endDateTime = `${endYear}${endMonth}${endDay}T${endHour}${endMinute}00`;
            }

            events.push({
                start: startDateTime,
                end: endDateTime,
                summary: "勤務"
            });
        }
    });

    if (events.length === 0) {
        alert("有効なシフトデータがありません。");
        return;
    }

    let icsContent = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Shift Calculator//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n";
    events.forEach((event, index) => {
        icsContent += `BEGIN:VEVENT\r\nUID:${Date.now() + index}@shiftcalculator.com\r\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\nDTSTART;TZID=Asia/Tokyo:${event.start}\r\nDTEND;TZID=Asia/Tokyo:${event.end}\r\nSUMMARY:${event.summary}\r\nEND:VEVENT\r\n`;
    });
    icsContent += "END:VCALENDAR\r\n";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'shifts.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
}
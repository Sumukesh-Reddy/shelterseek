const bookingController = require('../src/controllers/bookingController');
const Booking = require('../src/models/Booking');
const Room = require('../src/models/Room');
const { Traveler, Host } = require('../src/models/User');
const AppError = require('../src/utils/appError');
const { sendBookingConfirmationEmail } = require('../src/services/emailService');

jest.mock('../src/models/Booking');
jest.mock('../src/models/Room');
jest.mock('../src/models/User');
jest.mock('../src/services/emailService');

describe('Booking Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {},
            user: { _id: 'user123', name: 'Test User', email: 'test@traveler.com' }
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('getTravelerBookings', () => {
        it('should return bookings for a traveler', async () => {
            req.user.accountType = 'traveller';
            const mockBookings = [{ _id: 'b1', totalCost: 100 }, { _id: 'b2', totalCost: 200 }];
            
            Booking.find.mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockBookings)
            });

            await bookingController.getTravelerBookings(req, res, next);

            expect(Booking.find).toHaveBeenCalledWith({ travelerId: 'user123' });
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                count: 2,
                bookings: mockBookings
            });
        });

        it('should block non-travelers', async () => {
            req.user.accountType = 'host';
            await bookingController.getTravelerBookings(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(403);
        });
    });

    describe('getBookingStats', () => {
        it('should return stats using aggregation', async () => {
            const mockStats = [{
                total: [{ count: 10 }],
                thisMonth: [{ count: 5 }],
                thisWeek: [{ count: 2 }]
            }];
            
            Booking.aggregate.mockResolvedValue(mockStats);

            await bookingController.getBookingStats(req, res, next);

            expect(Booking.aggregate).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                total: 10,
                thisMonth: 5,
                thisWeek: 2
            }));
        });
    });
});

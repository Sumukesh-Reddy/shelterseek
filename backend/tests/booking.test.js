const bookingController = require('../src/controllers/bookingController');
const Booking = require('../src/models/Booking');
const Room = require('../src/models/Room');
const { Traveler, Host } = require('../src/models/User/index');
const AppError = require('../src/utils/appError');
const { sendBookingConfirmationEmail } = require('../src/services/emailService');

jest.mock('../src/models/Booking', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  aggregate: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn()
}));
jest.mock('../src/models/Room');
jest.mock('../src/models/User/index', () => ({
  Traveler: { find: jest.fn(), findById: jest.fn() },
  Host: { find: jest.fn(), findById: jest.fn() }
}));
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

    describe('getBookingById', () => {
        it('should return 200 if booking exists and belongs to user', async () => {
            req.params = { id: 'b1' };
            const mockBooking = { _id: 'b1', travelerId: 'user123' };
            Booking.findById.mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockBooking)
            });

            await bookingController.getBookingById(req, res, next);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                booking: mockBooking
            }));
        });

        it('should return 404 if booking not found', async () => {
            req.params = { id: 'b1' };
            Booking.findById.mockReturnValue({
                lean: jest.fn().mockResolvedValue(null)
            });

            await bookingController.getBookingById(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(AppError));
        });
    });

    describe('updateBookingStatus', () => {
        it('should update status successfully', async () => {
            req.params = { id: 'b1' };
            req.body = { status: 'confirmed' };
            const mockBooking = { _id: 'b1', status: 'pending' };
            
            Booking.findByIdAndUpdate.mockResolvedValue({ ...mockBooking, status: 'confirmed' });

            await bookingController.updateBookingStatus(req, res, next);
            expect(Booking.findByIdAndUpdate).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true
            }));
        });
    });

    describe('getHostBookings', () => {
        it('should return bookings for rooms owned by host', async () => {
            req.user.accountType = 'host';
            const mockBookings = [{ _id: 'b1' }];
            
            Booking.find.mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockBookings)
            });

            await bookingController.getHostBookings(req, res, next);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                bookings: mockBookings
            }));
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty stats', async () => {
            Booking.aggregate.mockResolvedValue([{
                total: [],
                thisMonth: [],
                thisWeek: []
            }]);

            await bookingController.getBookingStats(req, res, next);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                total: 0,
                thisMonth: 0
            }));
        });

        it('should handle database errors in getTravelerBookings', async () => {
            req.user.accountType = 'traveller';
            Booking.find.mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                lean: jest.fn().mockRejectedValue(new Error('DB Error'))
            });

            await bookingController.getTravelerBookings(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });
});


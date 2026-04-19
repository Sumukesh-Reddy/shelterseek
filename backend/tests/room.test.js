const roomController = require('../src/controllers/roomController');
const Room = require('../src/models/Room');
const { Host, Traveler } = require('../src/models/User/index');
const Booking = require('../src/models/Booking');

jest.mock('../src/models/Room');
jest.mock('../src/models/User/index');
jest.mock('../src/models/Booking');

describe('Room Controller Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            query: {},
            headers: {},
            params: {}
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();

        // Setup default mocks for chainable methods
        const mockQuery = {
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(null)
        };
        
        Traveler.findById.mockReturnValue(mockQuery);
        Host.findById.mockReturnValue(mockQuery);
    });

    describe('getAllRooms', () => {
        it('should return 200 and paginated rooms', async () => {
            Room.countDocuments.mockResolvedValue(10);
            Room.find.mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([{ _id: 'r1', name: 'Test Host' }])
            });

            Host.find.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([{ name: 'Test Host', email: 'host@test.com' }])
            });

            await roomController.getAllRooms(req, res, next);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'success',
                total: 10
            }));
        });
    });

    describe('getRoomById', () => {
        it('should return 200 if room exists', async () => {
            req.params.id = 'r1';
            const mockRoom = { _id: 'r1', name: 'Deluxe Room' };
            Room.findById.mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockRoom)
            });

            await roomController.getRoomById(req, res, next);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'success',
                data: mockRoom
            }));
        });

        it('should return 404 if room not found', async () => {
            req.params.id = 'nonexistent';
            Room.findById.mockReturnValue({
                lean: jest.fn().mockResolvedValue(null)
            });

            await roomController.getRoomById(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
        });
        
        it('should handle invalid ID format', async () => {
            req.params.id = 'invalid';
            Room.findById.mockReturnValue({
                lean: jest.fn().mockRejectedValue(new Error('CastError'))
            });

            await roomController.getRoomById(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });

    describe('Search and Filters', () => {
        it('should apply location filter', async () => {
            req.query.location = 'New York';
            Room.countDocuments.mockResolvedValue(1);
            Room.find.mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([])
            });

            await roomController.getAllRooms(req, res, next);
            expect(Room.find).toHaveBeenCalledWith(expect.objectContaining({
                location: expect.any(Object)
            }));
        });

        it('should apply price range filters', async () => {
            req.query.minPrice = '100';
            req.query.maxPrice = '500';
            Room.countDocuments.mockResolvedValue(1);
            Room.find.mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([])
            });

            await roomController.getAllRooms(req, res, next);
            expect(Room.find).toHaveBeenCalledWith(expect.objectContaining({
                price: { $gte: 100, $lte: 500 }
            }));
        });

        it('should handle sorting by price ascending', async () => {
            req.query.sort = 'price_asc';
            const mockSort = jest.fn().mockReturnThis();
            Room.find.mockReturnValue({
                sort: mockSort,
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([])
            });

            await roomController.getAllRooms(req, res, next);
            expect(mockSort).toHaveBeenCalledWith('price');
        });

        it('should handle sorting by price descending', async () => {
            req.query.sort = 'price_desc';
            const mockSort = jest.fn().mockReturnThis();
            Room.find.mockReturnValue({
                sort: mockSort,
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([])
            });

            await roomController.getAllRooms(req, res, next);
            expect(mockSort).toHaveBeenCalledWith('-price');
        });
    });

    describe('Room Statistics', () => {
        it('should handle aggregation errors gracefully', async () => {
            Room.aggregate.mockRejectedValue(new Error('Aggregation failed'));
            await roomController.getRoomCounts(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should handle missing count data', async () => {
            Room.countDocuments.mockResolvedValue(0);
            Room.aggregate.mockResolvedValue([]);
            Booking.countDocuments.mockResolvedValue(0);

            await roomController.getRoomCounts(req, res, next);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                counts: expect.objectContaining({ total: 0 })
            }));
        });
    });
});


const roomController = require('../src/controllers/roomController');
const Room = require('../src/models/Room');
const { Host } = require('../src/models/User');
const AppError = require('../src/utils/appError');

jest.mock('../src/models/Room');
jest.mock('../src/models/User');

describe('Room Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            query: {},
            headers: {}
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('getAllRooms', () => {
        it('should return paginated rooms', async () => {
            const mockRooms = [{ _id: 'r1', title: 'Room 1', email: 'host@test.com' }];
            
            Room.countDocuments.mockResolvedValue(10);
            Room.find.mockReturnValue({
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockRooms)
            });

            // Mock host lookup for batch fetch
            Host.find.mockResolvedValue([{ email: 'host@test.com', profilePhoto: 'photo.jpg' }]);

            await roomController.getAllRooms(req, res, next);

            expect(Room.find).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                results: 1,
                total: 10
            }));
        });
    });

    describe('getRoomCounts', () => {
        it('should return counts by status', async () => {
            Room.countDocuments.mockImplementation((filter) => {
                if (filter.status === 'verified') return 5;
                if (filter.status === 'pending') return 3;
                return 10;
            });

            await roomController.getRoomCounts(req, res, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                verified: 5,
                pending: 3,
                total: 10
            });
        });
    });
});

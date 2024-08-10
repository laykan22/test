import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { HttpStatus } from '@nestjs/common';
import { Document } from 'mongoose';
import { User } from '../auth/schema/user.schema';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('update', () => {
    it('should call UserService.update with correct parameters', async () => {
      const updateUserDto: UpdateUserDto = { name: 'New Name' };
      const user = { id: 'userId123' };

      // Mock Mongoose document
      const mockUserDoc: Document<any, any, User> & User & { _id: any } = {
        id: 'userId123',
        name: 'New Name',
        // Include other Mongoose document methods if needed, e.g., $save
        // Add these methods for a complete mock, or use a more sophisticated mocking library
        $save: jest.fn(),
        $isModified: jest.fn(),
        $markModified: jest.fn(),
        $get: jest.fn(),
      } as any;

      const updateResult = {
        statusCode: HttpStatus.OK,
        message: 'Update successful',
        data: mockUserDoc,
      };

      jest.spyOn(userService, 'update').mockResolvedValue(updateResult);

      const result = await controller.update(user, updateUserDto);

      expect(userService.update).toHaveBeenCalledWith(user.id, updateUserDto);
      expect(result).toEqual(updateResult);
    });
  });

  describe('remove', () => {
    it('should call UserService.remove with correct parameters', async () => {
      const user = { id: 'userId123' };

      const removeResult = {
        statusCode: HttpStatus.OK,
        message: 'Remove successful',
        data: null,
      };

      jest.spyOn(userService, 'remove').mockResolvedValue(removeResult);

      const result = await controller.remove(user);

      expect(userService.remove).toHaveBeenCalledWith(user.id);
      expect(result).toEqual(removeResult);
    });
  });
});

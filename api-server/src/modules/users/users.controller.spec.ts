import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { ForbiddenException } from "@nestjs/common";
import { UpdateAthleteProfileDto } from "./dto/update-athlete-profile.dto";
import { UpdateCoachProfileDto } from "./dto/update-coach-profile.dto";
import { UpdateAssistantProfileDto } from "./dto/update-assistant-profile.dto";
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";

describe("UsersController Profile Security", () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    getAthleteProfile: jest
      .fn()
      .mockImplementation((id) => Promise.resolve({ userId: id, achievements: "Mock Athlete" })),
    upsertAthleteProfile: jest
      .fn()
      .mockImplementation((id, data) => Promise.resolve({ userId: id, ...data })),
    getCoachProfile: jest
      .fn()
      .mockImplementation((id) => Promise.resolve({ userId: id, specialty: "Mock Coach" })),
    upsertCoachProfile: jest
      .fn()
      .mockImplementation((id, data) => Promise.resolve({ userId: id, ...data })),
    getAssistantProfile: jest
      .fn()
      .mockImplementation((id) => Promise.resolve({ userId: id, medicalDesc: "Mock Assistant" })),
    upsertAssistantProfile: jest
      .fn()
      .mockImplementation((id, data) => Promise.resolve({ userId: id, ...data })),
    getAdminStats: jest.fn().mockImplementation(() => Promise.resolve({ totalUsers: 10 })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  describe("Athlete Profile GET Endpoint", () => {
    it("should allow owner to access their athlete profile", async () => {
      const req = { user: { id: "user-123", role: "USER" } };
      const res = await controller.getAthleteProfile(req, "user-123");
      expect(res).toBeDefined();
      expect(mockUsersService.getAthleteProfile).toHaveBeenCalledWith("user-123");
    });

    it("should allow admin/super_admin to access other athlete profiles", async () => {
      const reqAdmin = { user: { id: "admin-123", role: "ADMIN" } };
      const res = await controller.getAthleteProfile(reqAdmin, "user-123");
      expect(res).toBeDefined();
      expect(mockUsersService.getAthleteProfile).toHaveBeenCalledWith("user-123");
    });

    it("should throw ForbiddenException if user tries to access another athlete profile", async () => {
      const req = { user: { id: "user-456", role: "USER" } };
      await expect(controller.getAthleteProfile(req, "user-123")).rejects.toThrow(
        "Forbidden profile access"
      );
      expect(mockUsersService.getAthleteProfile).not.toHaveBeenCalled();
    });
  });

  describe("Coach Profile PUT Endpoint", () => {
    it("should allow owner to update their coach profile and strip isVerified", async () => {
      const req = { user: { id: "user-123", role: "INSTRUCTOR" } };
      const data: UpdateCoachProfileDto = {
        sportId: "sport-1",
        experienceYears: 5,
        isVerified: true,
      };

      await controller.updateCoachProfile(req, "user-123", data);

      expect(mockUsersService.upsertCoachProfile).toHaveBeenCalledWith(
        "user-123",
        expect.not.objectContaining({ isVerified: true })
      );
    });

    it("should allow admin to update other coach profile and keep isVerified", async () => {
      const reqAdmin = { user: { id: "admin-123", role: "ADMIN" } };
      const data: UpdateCoachProfileDto = {
        sportId: "sport-1",
        experienceYears: 5,
        isVerified: true,
      };

      await controller.updateCoachProfile(reqAdmin, "user-123", data);

      expect(mockUsersService.upsertCoachProfile).toHaveBeenCalledWith(
        "user-123",
        expect.objectContaining({ isVerified: true })
      );
    });

    it("should throw ForbiddenException if non-owner non-admin tries to update coach profile", async () => {
      const req = { user: { id: "user-456", role: "USER" } };
      const data: UpdateCoachProfileDto = { sportId: "sport-1" };

      await expect(controller.updateCoachProfile(req, "user-123", data)).rejects.toThrow(
        "Forbidden profile update"
      );
      expect(mockUsersService.upsertCoachProfile).not.toHaveBeenCalled();
    });
  });

  describe("Assistant Profile PUT Endpoint", () => {
    it("should allow owner to update assistant profile and strip isVerified", async () => {
      const req = { user: { id: "user-123", role: "USER" } };
      const data: UpdateAssistantProfileDto = {
        medicalDesc: "Cert",
        isVerified: true,
      };

      await controller.updateAssistantProfile(req, "user-123", data);

      expect(mockUsersService.upsertAssistantProfile).toHaveBeenCalledWith(
        "user-123",
        expect.not.objectContaining({ isVerified: true })
      );
    });

    it("should throw ForbiddenException if non-owner tries to update assistant profile", async () => {
      const req = { user: { id: "user-456", role: "USER" } };
      const data: UpdateAssistantProfileDto = { medicalDesc: "Cert" };

      await expect(controller.updateAssistantProfile(req, "user-123", data)).rejects.toThrow(
        "Forbidden profile update"
      );
    });
  });

  describe("Admin Statistics GET Endpoint Security", () => {
    it("should have JwtAuthGuard and RolesGuard applied", () => {
      const guards = Reflect.getMetadata(
        GUARDS_METADATA,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        controller.getAdminStats
      );
      expect(guards).toBeDefined();
      expect(guards).toContain(JwtAuthGuard);
      expect(guards).toContain(RolesGuard);
    });

    it("should have Roles set to ADMIN and SUPER_ADMIN", () => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const roles = Reflect.getMetadata("roles", controller.getAdminStats);
      expect(roles).toBeDefined();
      expect(roles).toContain("ADMIN");
      expect(roles).toContain("SUPER_ADMIN");
    });

    it("should allow fetching admin statistics", async () => {
      const req = { user: { id: "admin-123", role: "ADMIN" } };
      const res = await controller.getAdminStats(req);
      expect(res).toEqual({ totalUsers: 10 });
      expect(mockUsersService.getAdminStats).toHaveBeenCalled();
    });
  });
});

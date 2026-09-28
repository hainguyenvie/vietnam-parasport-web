import { Test, TestingModule } from "@nestjs/testing";
import { CourseProgressController } from "./course-progress.controller";

describe("CourseProgressController", () => {
  let controller: CourseProgressController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourseProgressController],
    }).compile();

    controller = module.get<CourseProgressController>(CourseProgressController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});

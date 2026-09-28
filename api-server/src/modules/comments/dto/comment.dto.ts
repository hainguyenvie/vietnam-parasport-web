import { IsString, IsNotEmpty, IsIn, IsOptional, IsArray } from "class-validator";

export class CreateCommentDto {
  @IsString() @IsNotEmpty() content!: string;
  @IsString() @IsOptional() postId?: string;
  @IsString() @IsOptional() matchId?: string;
  @IsString() @IsOptional() parentId?: string;
  @IsArray() @IsOptional() imageAttachments?: string[];
}

export class ReactCommentDto {
  @IsString() @IsNotEmpty() type!: string;
}

export class ModerateCommentDto {
  @IsIn(["APPROVED", "HIDDEN"]) status!: "APPROVED" | "HIDDEN";
}

export class UpdateCommentDto {
  @IsString() @IsNotEmpty() content!: string;
}

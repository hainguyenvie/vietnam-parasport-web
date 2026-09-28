import { Module } from "@nestjs/common";
import { LoggerModule } from "nestjs-pino";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { BullModule } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { AuditInterceptor } from "./common/interceptors/audit.interceptor";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter";
import { GlobalCacheModule } from "./common/cache/cache.module";
import { CsrfGuard } from "./common/guards/csrf.guard";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./modules/users/users.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AssistantProfilesModule } from "./modules/assistant-profiles/assistant-profiles.module";
import { ReportsQueueModule } from "./modules/reports/reports.queue";
import { CalendarModule } from "./modules/calendar/calendar.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { TagsModule } from "./modules/tags/tags.module";
import { PostsModule } from "./modules/posts/posts.module";
import { CommentsModule } from "./modules/comments/comments.module";
import { BookmarksModule } from "./modules/bookmarks/bookmarks.module";
import { CoursesModule } from "./modules/courses/courses.module";
import { ChaptersModule } from "./modules/chapters/chapters.module";
import { LessonsModule } from "./modules/lessons/lessons.module";
import { CourseProgressModule } from "./modules/course-progress/course-progress.module";
import { SearchModule } from "./modules/search/search.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { CompanionRequestsModule } from "./modules/companion-requests/companion-requests.module";
import { PartnersModule } from "./modules/partners/partners.module";
import { SportsModule } from "./modules/sports/sports.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { QuizzesModule } from "./modules/quizzes/quizzes.module";
import { MatchesModule } from "./modules/matches/matches.module";
import { RankingsModule } from "./modules/rankings/rankings.module";
import { DisabilityTypesModule } from "./modules/disability-types/disability-types.module";
import { EventsModule } from "./modules/events/events.module";
import { RolesModule } from "./modules/roles/roles.module";
import { TournamentsModule } from "./modules/tournaments/tournaments.module";
import { StatisticsModule } from "./modules/statistics/statistics.module";
import { TeamsModule } from "./modules/teams/teams.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { CapcutTemplatesModule } from "./modules/capcut-templates/capcut-templates.module";
import { AssignmentsModule } from "./modules/assignments/assignments.module";
import { DocumentTopicsModule } from "./modules/document-topics/document-topics.module";
import { SocialLinksModule } from "./modules/social-links/social-links.module";
import { SportEventsModule } from "./modules/sport-events/sport-events.module";
import { SportClassificationsModule } from "./modules/sport-classifications/sport-classifications.module";
import { AthleteAchievementsModule } from "./modules/athlete-achievements/athlete-achievements.module";
import { SubTournamentsModule } from "./modules/sub-tournaments/sub-tournaments.module";
import { MediaModule } from "./modules/media/media.module";
import { MailModule } from "./modules/mail/mail.module";
import { EmailTemplatesModule } from "./modules/email-templates/email-templates.module";
import { CommissionsModule } from "./modules/commissions/commissions.module";
import { AffiliateModule } from "./modules/affiliate/affiliate.module";
import { ProductsModule } from "./modules/products/products.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { OrdersModule } from "./modules/orders/orders.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3001),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        SMTP_HOST: Joi.string().required(),
        SMTP_PORT: Joi.number().default(587),
        SMTP_USER: Joi.string().required(),
        SMTP_PASS: Joi.string().required(),
        SMTP_FROM: Joi.string().optional(),
      }),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        redact: {
          paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            "res.headers.set-cookie",
          ],
          censor: "[REDACTED]",
        },
        transport:
          process.env.NODE_ENV !== "production"
            ? {
                target: "pino-pretty",
                options: {
                  singleLine: true,
                },
              }
            : undefined,
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{ ttl: 60000, limit: 100 }],
        // Redis storage enabled automatically when REDIS_HOST is set;
        // falls back to in-memory storage otherwise (single-instance OK)
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get("REDIS_HOST") || "localhost",
          port: parseInt(config.get("REDIS_PORT") || "6379", 10),
          password: config.get("REDIS_PASSWORD") || undefined,
        },
      }),
    }),
    PrismaModule,
    GlobalCacheModule,
    UsersModule,
    AuthModule,
    MailModule,
    CategoriesModule,
    TagsModule,
    PostsModule,
    CommentsModule,
    BookmarksModule,
    CoursesModule,
    ChaptersModule,
    LessonsModule,
    CourseProgressModule,
    SearchModule,
    OrganizationsModule,
    CompanionRequestsModule,
    PartnersModule,
    SportsModule,
    SettingsModule,
    QuizzesModule,
    MatchesModule,
    RankingsModule,
    DisabilityTypesModule,
    EventsModule,
    RolesModule,
    TournamentsModule,
    StatisticsModule,
    TeamsModule,
    DocumentsModule,
    CapcutTemplatesModule,
    AssignmentsModule,
    DocumentTopicsModule,
    SocialLinksModule,
    SportEventsModule,
    SportClassificationsModule,
    AthleteAchievementsModule,
    SubTournamentsModule,
    AssistantProfilesModule,
    ReportsQueueModule,
    CalendarModule,
    MediaModule,
    EmailTemplatesModule,
    CommissionsModule,
    AffiliateModule,
    ProductsModule,
    ReviewsModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}

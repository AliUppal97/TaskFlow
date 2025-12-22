import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';

import { EventLog, EventType } from '../../entities/event-log.entity';
import { EventQuery } from '../../common/types';

export interface EventLogData {
  type: EventType;
  actorId: string;
  entityId: string;
  entityType: string;
  payload: Record<string, any>;
  correlationId?: string;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
  };
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectModel(EventLog.name) private eventLogModel: Model<EventLog>,
  ) {}

  async logEvent(eventData: EventLogData): Promise<void> {
    try {
      const eventLog = new this.eventLogModel({
        ...eventData,
        correlationId: eventData.correlationId || randomUUID(),
        metadata: {
          ...eventData.metadata,
          timestamp: new Date(),
        },
      });

      await eventLog.save();

      this.logger.log(
        `Event logged: ${eventData.type} - Actor: ${eventData.actorId} - Entity: ${eventData.entityId}`,
      );
    } catch (error: unknown) {
      this.logger.error(`Failed to log event: ${eventData.type}`, error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  async getEntityEvents(
    entityId: string,
    entityType: string,
    options: {
      limit?: number;
      offset?: number;
      type?: EventType;
    } = {},
  ): Promise<EventLog[]> {
    const { limit = 50, offset = 0, type } = options;

    const query: Partial<EventQuery> = {
      entityId,
      entityType,
    };

    if (type) {
      query.type = type;
    }

    return this.eventLogModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .exec();
  }

  async getUserEvents(
    actorId: string,
    options: {
      limit?: number;
      offset?: number;
      type?: EventType;
    } = {},
  ): Promise<EventLog[]> {
    const { limit = 50, offset = 0, type } = options;

    const query: Partial<EventQuery> = {
      actorId,
    };

    if (type) {
      query.type = type;
    }

    return this.eventLogModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .exec();
  }

  async getEventsByCorrelationId(correlationId: string): Promise<EventLog[]> {
    return this.eventLogModel
      .find({ correlationId })
      .sort({ createdAt: 1 })
      .exec();
  }
}





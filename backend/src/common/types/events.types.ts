import { EventType } from '../../entities/event-log.entity';

/**
 * Query parameters for event log filtering
 */
export interface EventQuery {
  type?: EventType;
  actorId?: string;
  entityId?: string;
  entityType?: string;
  correlationId?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Event log aggregation query
 */
export interface EventAggregationQuery {
  type?: EventType;
  actorId?: string;
  entityType?: string;
  fromDate?: Date;
  toDate?: Date;
  groupBy: 'type' | 'actorId' | 'entityType' | 'day' | 'hour';
}

/**
 * Event statistics result
 */
export interface EventStats {
  totalEvents: number;
  eventsByType: Record<EventType, number>;
  eventsByActor: Record<string, number>;
  eventsByEntityType: Record<string, number>;
  eventsByTime: Array<{
    period: string;
    count: number;
  }>;
}



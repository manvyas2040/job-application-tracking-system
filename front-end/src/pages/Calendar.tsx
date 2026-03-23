import React, { useState, useEffect } from 'react';
import { apiCall, getUser } from '../api';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, X, Clock, User, Briefcase } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';

interface CalendarEvent {
  interview_id: number;
  title: string;
  start: string;
  end: string;
  candidate_name: string;
  interview_type: string;
  interviewer_id: number;
  interviewer_name: string;
  status: string;
  application_id: number;
}

interface InterviewerOption {
  user_id: number;
  name: string;
}

export default function Calendar() {
  const user = getUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [interviewers, setInterviewers] = useState<InterviewerOption[]>([]);
  const [selectedInterviewer, setSelectedInterviewer] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchInterviewers = async () => {
    try {
      const data = await apiCall('/interviews/interviewers');
      setInterviewers(data);
    } catch (error) {
      console.error('Error fetching interviewers:', error);
    }
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      
      let url = `/interviews?start=${start}&end=${end}`;
      if (selectedInterviewer) {
        url += `&interviewer_id=${selectedInterviewer}`;
      }
      
      const data = await apiCall(url);
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviewers();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [currentDate, selectedInterviewer]);

  // Get the status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'rescheduled':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'awaiting_feedback':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start);
      return isSameDay(eventDate, date);
    });
  };

  // Calendar grid for month view
  const renderMonthCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="space-y-4">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center font-bold text-slate-600 py-3">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="space-y-2">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-2">
              {week.map((day) => {
                const dayEvents = getEventsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isCurrentDay = isToday(day);

                return (
                  <motion.div
                    key={day.toISOString()}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`min-h-[120px] rounded-xl border-2 p-2 cursor-pointer transition-all ${
                      isCurrentMonth
                        ? 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                        : 'bg-slate-50 border-slate-100 opacity-50'
                    } ${isCurrentDay ? 'border-blue-500 bg-blue-50' : ''}`}
                  >
                    {/* Date number */}
                    <div className={`text-sm font-bold mb-2 ${isCurrentDay ? 'text-blue-600' : 'text-slate-900'}`}>
                      {format(day, 'd')}
                    </div>

                    {/* Events */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <motion.div
                          key={event.interview_id}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                          className={`text-xs p-1 rounded cursor-pointer truncate transition-all hover:shadow-md ${getStatusColor(event.status)}`}
                          title={event.title}
                        >
                          {event.candidate_name}
                        </motion.div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-slate-500 font-medium px-1">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Week view
  const renderWeekCalendar = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="space-y-4">
        {/* Week header */}
        <div className="grid grid-cols-8 gap-2">
          <div className="font-bold text-slate-600 py-3">Time</div>
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="text-center">
              <div className="font-bold text-slate-900">{format(day, 'EEE')}</div>
              <div className={`text-sm ${isToday(day) ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>
                {format(day, 'd MMM')}
              </div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 gap-2 border-b border-slate-100 pb-2">
              <div className="text-xs text-slate-500 py-1 font-medium">{format(new Date().setHours(hour), 'HH:00')}</div>
              {weekDays.map((day) => {
                const dayEvents = getEventsForDate(day).filter((event) => {
                  const eventHour = new Date(event.start).getHours();
                  return eventHour === hour;
                });

                return (
                  <div key={day.toISOString()} className="relative bg-slate-50 rounded-lg min-h-[60px]">
                    {dayEvents.map((event) => (
                      <motion.div
                        key={event.interview_id}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={() => setSelectedEvent(event)}
                        className={`absolute inset-0 p-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${getStatusColor(event.status)}`}
                      >
                        <div className="text-xs font-bold truncate">{event.candidate_name}</div>
                        <div className="text-xs opacity-75">{event.interview_type}</div>
                      </motion.div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const filteredEvents = selectedInterviewer
    ? events.filter((e) => e.interviewer_id === selectedInterviewer)
    : events;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Interview Calendar</h1>
        <p className="text-slate-500">View and manage interview schedules in an interactive calendar.</p>
      </header>

      {/* Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          {/* Month/Year and Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-bold text-slate-900 min-w-[150px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Week
            </button>
          </div>

          {/* Interviewer Filter */}
          <div className="flex-1 min-w-[200px]">
            <select
              value={selectedInterviewer || ''}
              onChange={(e) => setSelectedInterviewer(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Interviewers</option>
              {interviewers.map((interviewer) => (
                <option key={interviewer.user_id} value={interviewer.user_id}>
                  {interviewer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Today Button */}
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-all"
          >
            Today
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-400"></div>
            <span className="text-sm text-slate-600">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-400"></div>
            <span className="text-sm text-slate-600">Rescheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-400"></div>
            <span className="text-sm text-slate-600">Awaiting Feedback</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-400"></div>
            <span className="text-sm text-slate-600">Completed</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        {viewMode === 'month' ? renderMonthCalendar() : renderWeekCalendar()}
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
            >
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Interview Details</h2>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(selectedEvent.status)}`}>
                    {selectedEvent.status.replace('_', ' ').toUpperCase()}
                  </div>
                </div>

                {/* Candidate */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Candidate</label>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                      {selectedEvent.candidate_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{selectedEvent.candidate_name}</p>
                    </div>
                  </div>
                </div>

                {/* Interview Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Briefcase size={16} /> Interview Type
                  </label>
                  <p className="font-medium text-slate-900">{selectedEvent.interview_type.toUpperCase()}</p>
                </div>

                {/* Date & Time */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Clock size={16} /> Date & Time
                  </label>
                  <p className="font-medium text-slate-900">
                    {format(new Date(selectedEvent.start), 'MMMM d, yyyy')}
                  </p>
                  <p className="text-slate-600">
                    {format(new Date(selectedEvent.start), 'h:mm aa')} - {format(new Date(selectedEvent.end), 'h:mm aa')}
                  </p>
                </div>

                {/* Interviewer */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <User size={16} /> Interviewer
                  </label>
                  <p className="font-medium text-slate-900">{selectedEvent.interviewer_name}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      window.location.href = `/application-detail/${selectedEvent.application_id}`;
                    }}
                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
                  >
                    View Application
                  </button>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Event List Summary */}
      {filteredEvents.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Upcoming Interviews</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {filteredEvents.slice(0, 10).map((event) => (
              <motion.div
                key={event.interview_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${getStatusColor(event.status)}`}
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold">{event.candidate_name}</h4>
                  <span className="text-xs font-bold opacity-75">{event.interview_type}</span>
                </div>
                <p className="text-sm opacity-75 mb-2">{event.interviewer_name}</p>
                <p className="text-xs opacity-75">{format(new Date(event.start), 'MMM d, yyyy h:mm aa')}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

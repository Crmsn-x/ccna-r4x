import { NextResponse, type NextRequest } from 'next/server';
import { getStore } from '@/server/store';
import type { SessionMode, ContentTrack, ScopeFilterSnapshot } from '@/domain/types';

export async function GET() {
  try {
    const store = getStore();
    const sessions = await store.listSessions();
    return NextResponse.json({ success: true, sessions });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, contentTrack, scopeFilter, timeLimitMinutes } = body as {
      mode: SessionMode;
      contentTrack: ContentTrack;
      scopeFilter: ScopeFilterSnapshot;
      timeLimitMinutes?: number;
    };

    if (!mode || !['learn', 'assess'].includes(mode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid mode: must be "learn" or "assess"' },
        { status: 400 }
      );
    }

    if (!contentTrack || !['verified', 'draft', 'fixture'].includes(contentTrack)) {
      return NextResponse.json(
        { success: false, error: 'Invalid contentTrack: must be "verified", "draft", or "fixture"' },
        { status: 400 }
      );
    }

    if (!scopeFilter || typeof scopeFilter.requestedCount !== 'number' || scopeFilter.requestedCount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid scopeFilter with requestedCount > 0 is required' },
        { status: 400 }
      );
    }

    const store = getStore();

    // Rule: Normal assessments use reviewed content only. Draft content cannot enter normal assessment.
    if (mode === 'assess' && contentTrack === 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: 'Assessment requires reviewed content. Draft question bank content can only be practiced in Learn mode. To test the assessment workflow, enable Developer Mode in Settings and use isolated development fixtures.',
        },
        { status: 400 }
      );
    }

    // Verification check: if user requests verified content, verify that verified content exists
    if (contentTrack === 'verified') {
      const allQ = await store.getQuestions({ includeDevFixtures: false });
      const verified = allQ.filter(q => q.status === 'verified');
      if (verified.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Reviewed content is currently unavailable (0 questions verified). Please practice using Draft Practice in Learn mode, or enable Developer Mode in Settings to test with isolated fixtures.',
          },
          { status: 400 }
        );
      }
    }

    const timeLimitSeconds = timeLimitMinutes && timeLimitMinutes > 0
      ? Math.round(timeLimitMinutes * 60)
      : undefined;

    const session = await store.createSession({
      userId: 'local',
      mode,
      contentTrack,
      scopeFilter,
      timeLimitSeconds,
    });

    return NextResponse.json({ success: true, session });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 400 }
    );
  }
}

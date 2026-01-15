// services/submission.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface User {
  ID: number;
  first_name_th: string;
  last_name_th: string;
  first_name_en: string;
  last_name_en: string;
  profile_image_url?: string;
  type_id: number;
}

export interface Portfolio {
  ID: number;
  portfolio_name: string;
}

export interface PortfolioSubmission {
  ID: number;
  version: number;
  status: string;
  submission_at: string;
  is_current_version: boolean;
  user: {
    ID: number;
    first_name_th: string;
    last_name_th: string;
    profile_image_url?: string;
  };
  portfolio: {
    ID: number;
    portfolio_name: string;
  };
}


export interface Feedback {
  ID: number;
  overall_comment: string;
  strengths: string;
  areas_for_improvement: string;
  create_at: string;
  portfolio_submission_id: number;
  user_id: number;
}

export interface ScoreCriteria {
  ID: number;
  criteria_number: number;
  criteria_name: string;
  max_score: number;
  score: number;
  weight_percent: number;
  comment: string;
  order_index: number;
  scorecard_id: number;
}

export interface Scorecard {
  ID: number;
  total_score: number;
  max_score: number;
  general_comment: string;
  create_at: string;
  portfolio_submission_id: number;
  user_id: number;
  score_criteria?: ScoreCriteria[];
}


class SubmissionService {
  ID(ID: any): void {
    throw new Error("Method not implemented.");
  }
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // ===================== Portfolio Submissions =====================


    async createSubmission(data: {
      portfolio_id: number;
      }): Promise<PortfolioSubmission> {
      const response = await fetch(`${API_URL}/submissions`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create submission');
      }

      return response.json();
    }

  async fetchAllSubmissions(): Promise<PortfolioSubmission[]> {
    const response = await fetch(`${API_URL}/submissions`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch submissions');
    }

    return response.json();
  }

  async fetchSubmissionsByStatus(status: string): Promise<PortfolioSubmission[]> {
    const response = await fetch(`${API_URL}/submissions/status/${status}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch submissions by status');
    }

    return response.json();
  }

  async fetchSubmissionById(id: number): Promise<PortfolioSubmission> {
    const response = await fetch(`${API_URL}/submissions/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch submission');
    }

    return response.json();
  }

  async markAsReviewed(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/submissions/${id}/reviewe`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to mark as reviewed');
    }
  }

  async markAsApproved(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/submissions/${id}/approve`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to mark as approved');
    }
  }

  async updateSubmissionStatus(id: number, status: string): Promise<void> {
    const response = await fetch(`${API_URL}/submissions/${id}/status`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error('Failed to update status');
    }
  }

  // ===================== Feedback =====================

  async createFeedback(feedback: {
    portfolio_submission_id: number;
    overall_comment: string;
    strengths: string;
    areas_for_improvement: string;
  }): Promise<Feedback> {
    const response = await fetch(`${API_URL}/feedbacks`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(feedback),
    });

    if (!response.ok) {
      throw new Error('Failed to create feedback');
    }

    return response.json();
  }

  async getFeedbackBySubmissionId(id: number): Promise<Feedback> {
    const response = await fetch(`${API_URL}/feedbacks/submission/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch feedback');
    }

    return response.json();
  }

  async updateFeedback(id: number, feedback: {
    overall_comment: string;
    strengths: string;
    areas_for_improvement: string;
  }): Promise<Feedback> {
    const response = await fetch(`${API_URL}/feedbacks/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(feedback),
    });

    if (!response.ok) {
      throw new Error('Failed to update feedback');
    }

    return response.json();
  }

  // ===================== Scorecard =====================

  

  async createScorecard(scorecard: {
    portfolio_submission_id: number;
    general_comment: string;
    score_criteria: {
      criteria_number: number;
      criteria_name: string;
      max_score: number;
      score: number;
      weight_percent: number;
      comment: string;
      order_index: number;
    }[];
  }): Promise<Scorecard> {
    const response = await fetch(`${API_URL}/scorecards`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(scorecard),
    });

    if (!response.ok) {
      throw new Error('Failed to create scorecard');
    }

    return response.json();
  }

  async getScorecardBySubmissionId(id: number): Promise<Scorecard> {
    const response = await fetch(`${API_URL}/scorecards/submission/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch scorecard');
    }

    return response.json();
  }

  async updateScorecard(id: number, scorecard: {
    general_comment: string;
    score_criteria: {
      ID: number;
      criteria_number: number;
      criteria_name: string;
      max_score: number;
      score: number;
      weight_percent: number;
      comment: string;
      order_index: number;
      scorecard_id: number;
    }[];
  }): Promise<Scorecard> {
    const response = await fetch(`${API_URL}/scorecards/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        general_comment: scorecard.general_comment,
        score_criteria: scorecard.score_criteria
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update scorecard');
    }

    return response.json();
  }


    // ===================== Get Submissions by Portfolio =====================
  async fetchSubmissionsByPortfolio(portfolioId: number): Promise<PortfolioSubmission[]> {
    const response = await fetch(`${API_URL}/submissions/portfolio/${portfolioId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch submissions by portfolio');
    }

    const text = await response.text();

    if (!text) {
      throw new Error("Empty response from server");
    }

    return JSON.parse(text);
  }


  // ===================== Get Latest Submission for Portfolio =====================
  async getLatestSubmission(portfolioId: number): Promise<PortfolioSubmission | null> {
    try {
      const submissions = await this.fetchSubmissionsByPortfolio(portfolioId);
      if (submissions.length === 0) return null;
      
      // เรียงตาม submission_at ล่าสุด
      return submissions.sort((a, b) => 
        new Date(b.submission_at).getTime() - new Date(a.submission_at).getTime()
      )[0];
    } catch (error) {
      console.error('Error fetching latest submission:', error);
      return null;
    }
  }
}

export default new SubmissionService();
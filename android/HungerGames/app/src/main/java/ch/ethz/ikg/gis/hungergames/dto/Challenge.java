package ch.ethz.ikg.gis.hungergames.dto;

/**
 * Created by rudid on 16.09.2017.
 */

public class Challenge {
    private String task;
    private String incentive;
    private String sponsor;

    public Challenge(String task, String incentive, String sponsor) {
        this.task = task;
        this.incentive = incentive;
        this.sponsor = sponsor;
    }

    public String getTask() {
        return task;
    }

    public void setTask(String task) {
        this.task = task;
    }

    public String getIncentive() {
        return incentive;
    }

    public void setIncentive(String incentive) {
        this.incentive = incentive;
    }

    public String getSponsor() {
        return sponsor;
    }

    public void setSponsor(String sponsor) {
        this.sponsor = sponsor;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        Challenge challenge = (Challenge) o;

        if (task != null ? !task.equals(challenge.task) : challenge.task != null) return false;
        if (incentive != null ? !incentive.equals(challenge.incentive) : challenge.incentive != null)
            return false;
        return sponsor != null ? sponsor.equals(challenge.sponsor) : challenge.sponsor == null;

    }

    @Override
    public int hashCode() {
        int result = task != null ? task.hashCode() : 0;
        result = 31 * result + (incentive != null ? incentive.hashCode() : 0);
        result = 31 * result + (sponsor != null ? sponsor.hashCode() : 0);
        return result;
    }

    @Override
    public String toString() {
        return "Challenge{" +
                "task='" + task + '\'' +
                ", incentive='" + incentive + '\'' +
                ", sponsor='" + sponsor + '\'' +
                '}';
    }
}

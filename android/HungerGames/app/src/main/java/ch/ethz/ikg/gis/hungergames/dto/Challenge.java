package ch.ethz.ikg.gis.hungergames.dto;

/**
 * Created by rudid on 16.09.2017.
 */

public class Challenge {
    private long id;
    private String task;
    private String incentive;
    private String sponsor;

    public Challenge(long id, String task, String incentive, String sponsor) {
        this.id = id;
        this.task = task;
        this.incentive = incentive;
        this.sponsor = sponsor;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
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

        return id == challenge.id;

    }

    @Override
    public int hashCode() {
        return (int) (id ^ (id >>> 32));
    }

    @Override
    public String toString() {
        return "Challenge{" +
                "id=" + id +
                ", task='" + task + '\'' +
                ", incentive='" + incentive + '\'' +
                ", sponsor='" + sponsor + '\'' +
                '}';
    }
}

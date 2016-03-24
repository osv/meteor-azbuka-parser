/*global JobCollection, CircleJobs, FetchJobs */

/* jshint -W020 */
// Job collection for repeatable jobs
CircleJobs = new JobCollection('circle');

/* jshint -W020 */
// Job collection for repeatable jobs
FetchJobs = new JobCollection('fetcher');
FetchJobs.TYPE_PROFILE_FETCH = 'profile';

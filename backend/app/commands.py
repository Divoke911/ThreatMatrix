import click
from flask.cli import with_appcontext
from app.utils.seed import seed_data

@click.command("seed-db")
@with_appcontext
def seed_db_command():
    """Seeds the ThreatMatrix database with initial demo data."""
    click.echo("Starting database seed script...")
    seed_data()
    click.echo("Seeding database complete!")
